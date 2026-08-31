/*
 * Minimal virtual-DOM: h()/mount()/patch() + a Preact/React-shaped Component
 * base class (setState, componentDidMount/WillUnmount). Exists so re-renders
 * patch the real DOM in place (by tag + key) instead of replacing subtrees —
 * that's what keeps a focused <input> focused (caret position included)
 * while its sibling elements re-render around it every second (rest timer)
 * or every keystroke.
 */
(function (global) {
  const SVG_TAGS = new Set(['svg', 'path', 'polyline', 'circle', 'line', 'rect', 'g']);

  function h(tag, props, ...children) {
    props = props || {};
    const key = props.key != null ? props.key : null;
    const flat = [];
    (function flatten(arr) {
      for (const c of arr) {
        if (c == null || c === false || c === true) continue;
        if (Array.isArray(c)) { flatten(c); continue; }
        if (typeof c === 'string' || typeof c === 'number') {
          flat.push({ tag: '#text', text: String(c), props: {}, children: [], key: null, dom: null });
        } else {
          flat.push(c);
        }
      }
    })(children);
    return { tag, props, children: flat, key, dom: null };
  }

  function sameType(a, b) {
    return a && b && a.tag === b.tag && a.key === b.key;
  }

  function setProp(el, key, value, oldValue, isSvg) {
    if (key === 'key' || key === 'children') return;
    if (key.startsWith('on') && (typeof value === 'function' || typeof oldValue === 'function')) {
      const evt = key.slice(2).toLowerCase();
      if (oldValue) el.removeEventListener(evt, oldValue);
      if (value) el.addEventListener(evt, value);
      return;
    }
    if (key === 'style') {
      const oldStyle = oldValue || {};
      const newStyle = value || {};
      for (const k in oldStyle) if (!(k in newStyle)) el.style[k] = '';
      for (const k in newStyle) if (oldStyle[k] !== newStyle[k]) el.style[k] = newStyle[k];
      return;
    }
    if (key === 'value' && 'value' in el) {
      const s = value == null ? '' : String(value);
      if (el.value !== s) el.value = s;
      return;
    }
    if (key === 'checked') { el.checked = !!value; return; }
    if (key === 'className') {
      if (isSvg) el.setAttribute('class', value || ''); else el.className = value || '';
      return;
    }
    if (value === false || value == null) { el.removeAttribute(key); return; }
    if (value === true) { el.setAttribute(key, ''); return; }
    el.setAttribute(key, value);
  }

  function removeProp(el, key, oldValue, isSvg) {
    setProp(el, key, null, oldValue, isSvg);
  }

  function mount(vnode, isSvg) {
    if (vnode.tag === '#text') {
      const dom = document.createTextNode(vnode.text);
      vnode.dom = dom;
      return dom;
    }
    const svgHere = isSvg || SVG_TAGS.has(vnode.tag);
    const dom = svgHere
      ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
      : document.createElement(vnode.tag);
    for (const k in vnode.props) setProp(dom, k, vnode.props[k], null, svgHere);
    vnode.children.forEach((child) => dom.appendChild(mount(child, svgHere)));
    vnode.dom = dom;
    return dom;
  }

  function patchChildren(parentEl, oldChildren, newChildren, isSvg) {
    oldChildren = oldChildren || [];
    newChildren = newChildren || [];
    const usedOld = new Set();
    const newDomList = new Array(newChildren.length);

    newChildren.forEach((nv, i) => {
      let ov = null;
      if (nv.key != null) {
        ov = oldChildren.find((c) => c.key === nv.key && !usedOld.has(c));
      } else {
        const cand = oldChildren[i];
        if (cand && cand.key == null) ov = cand;
      }
      if (ov && sameType(ov, nv)) {
        patch(ov.dom, ov, nv, isSvg);
        usedOld.add(ov);
        newDomList[i] = nv.dom;
      } else {
        newDomList[i] = mount(nv, isSvg);
      }
    });

    oldChildren.forEach((ov) => {
      if (!usedOld.has(ov) && ov.dom && ov.dom.parentNode === parentEl) parentEl.removeChild(ov.dom);
    });

    let ref = null;
    for (let i = newDomList.length - 1; i >= 0; i--) {
      const dom = newDomList[i];
      if (dom.parentNode !== parentEl || dom.nextSibling !== ref) parentEl.insertBefore(dom, ref);
      ref = dom;
    }
  }

  function patch(dom, oldVnode, newVnode, isSvg) {
    if (newVnode.tag === '#text') {
      if (oldVnode.text !== newVnode.text) dom.nodeValue = newVnode.text;
      newVnode.dom = dom;
      return;
    }
    const svgHere = isSvg || SVG_TAGS.has(newVnode.tag);
    const oldProps = oldVnode.props || {};
    const newProps = newVnode.props || {};
    for (const k in oldProps) if (!(k in newProps)) removeProp(dom, k, oldProps[k], svgHere);
    for (const k in newProps) if (oldProps[k] !== newProps[k] || k === 'style') setProp(dom, k, newProps[k], oldProps[k], svgHere);
    patchChildren(dom, oldVnode.children, newVnode.children, svgHere);
    newVnode.dom = dom;
  }

  function patchRoot(container, oldVnode, newVnode) {
    if (!oldVnode || !sameType(oldVnode, newVnode)) {
      const dom = mount(newVnode, false);
      if (oldVnode && oldVnode.dom) container.replaceChild(dom, oldVnode.dom);
      else container.appendChild(dom);
      return;
    }
    patch(oldVnode.dom, oldVnode, newVnode, false);
  }

  class Component {
    constructor(props) {
      this.props = props || {};
      this.state = this.state || {};
      this._container = null;
      this._vnode = null;
      this._scheduled = false;
      this._cb = null;
    }
    setState(patch, cb) {
      const next = typeof patch === 'function' ? patch(this.state) : patch;
      this.state = Object.assign({}, this.state, next);
      if (cb) this._cb = cb;
      if (!this._scheduled) {
        this._scheduled = true;
        queueMicrotask(() => {
          this._scheduled = false;
          this._flush();
        });
      }
    }
    _flush() {
      const newV = this.render();
      patchRoot(this._container, this._vnode, newV);
      this._vnode = newV;
      if (this._cb) { const cb = this._cb; this._cb = null; cb(); }
    }
    mount(container) {
      this._container = container;
      this._vnode = this.render();
      container.appendChild(mount(this._vnode, false));
      if (this.componentDidMount) this.componentDidMount();
    }
  }

  global.DC = { h, Component };
})(window);
