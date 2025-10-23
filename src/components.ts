import { RXObservable, RXObservableValue } from 'flinker'
import { buildClassName, UIComponentProps } from './core'
import { PseudoClassType } from './processor'

export type HtmlTag = 'div' | 'button' | 'a' | 'link' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'span' | 'img' | 'input' | 'textarea'
export type AnyUIComponent = UIComponent<any>

/*
*
* UIComponent
*
**/

export type ObserveAffect = 'affectsProps' | 'affectsChildrenProps' | 'recreateChildren'
export class UIComponent<P extends UIComponentProps> {
  static activeParent: UIComponent<any> | undefined

  readonly tag: HtmlTag
  dom: HTMLElement
  childrenColl: AnyUIComponent[] | undefined

  constructor(tag: HtmlTag) {
    this.tag = tag
    this.dom = document.createElement(tag)
    UIComponent.activeParent?.addChild(this)
  }

  protected readonly unsubscribeColl: (() => void)[] = []
  observe(rx: RXObservable<any, any>, affect1: ObserveAffect = 'affectsProps', affect2?: ObserveAffect) {
    this.unsubscribeColl.push(
      rx.pipe()
        .onReceive(() => this.render(affect1, affect2))
        .subscribe()
    )
    return this
  }

  protected onPropsChangeSubscribers: ((props: P) => void)[] | undefined
  propsDidChange(fn: (props: P) => void) {
    if (this.onPropsChangeSubscribers) this.onPropsChangeSubscribers.push(fn)
    else this.onPropsChangeSubscribers = [fn]
    !this.willDomUpdate && fn(this.props)
    return this
  }

  protected mapStateFn?: (state: P) => void
  map(fn: (state: P) => void) {
    if (this.mapStateFn !== fn) {
      this.mapStateFn = fn
      this.render('affectsProps')
    }
    return this
  }

  protected reactions: Array<(state: P) => void> = []
  react(fn: (state: P) => void) {
    this.reactions.push(fn)
    this.render('affectsProps')
    return this
  }

  protected whenHoveredFn?: (state: P) => void
  whenHovered(fn: (state: P) => void) {
    this.whenHoveredFn = fn
    this.render('affectsProps')
    return this
  }

  private instantiateChildrenFn?: () => void
  children(fn: () => void) {
    if (this.instantiateChildrenFn !== fn) {
      this.instantiateChildrenFn = fn
      this.render('recreateChildren')
    }
    return this
  }

  addChild(c: AnyUIComponent) {
    if (!this.childrenColl) this.childrenColl = []
    this.childrenColl.push(c)
    this.dom.appendChild(c.dom)
  }

  // Rendering
  
  protected willDomUpdate = false
  protected affectSet = new Set<ObserveAffect>()
  render(affect1: ObserveAffect, affect2?: ObserveAffect) {
    this.affectSet.add(affect1)
    affect2 && this.affectSet.add(affect2)

    if (!this.willDomUpdate) {
      this.willDomUpdate = true
      setTimeout(() => this.updateDom())
    }
  }

  protected props = {} as P
  protected updateDom() {
    if (this.isDestroyed) return
    if (!this.willDomUpdate) return

    this.willDomUpdate = false

    if (this.affectSet.has('affectsProps')) {
      this.updateProps()

      if (this.props.visible === false) {
        this.dom.hidden = true
        this.dom.className = ''
      } else {
        const cn = buildClassName(this.props, 'none')
        this.dom.className = cn
        this.dom.hidden = false
      }
    }

    if (this.affectSet.has('recreateChildren')) {
      if (this.childrenColl) {
        this.childrenColl?.forEach(c => c.destroy())
        this.childrenColl = undefined
      }

      if (this.instantiateChildrenFn !== undefined) {
        const p = UIComponent.activeParent
        UIComponent.activeParent = this
        this.instantiateChildrenFn()
        UIComponent.activeParent = p
      }
    } else if (this.affectSet.has('affectsChildrenProps')) {
      this.childrenColl?.forEach(c => c.render('affectsProps', 'affectsChildrenProps'))
    }

    if (this.affectSet.size > 0) {
      this.didDomUpdate()
      this.affectSet.clear()
    }
  }

  protected updateProps() {
    const res = {} as P
    this.reactions.forEach(fn => fn(res))
    if (this.whenHoveredFn) {
      if (!res.pseudo) res.pseudo = {} as Record<PseudoClassType, Record<string, any>>
      const state = {} as P
      this.whenHoveredFn(state)
      res.pseudo['hover'] = state
    }
    if (this.mapStateFn) this.mapStateFn(res)
    if (this.props.visible === false) this.props = {} as P
    this.props = res
    if (this.onPropsChangeSubscribers) this.onPropsChangeSubscribers.forEach(fn => fn(this.props))
  }

  protected didDomUpdate() {
    if (this.props.id) this.dom.id = this.props.id
    if (this.props.popUp) this.dom.title = this.props.popUp
  }

  /*
   * 
   * Destroing
   * 
   */

  isDestroyed = false
  destroy() {
    if (!this.isDestroyed) {
      this.isDestroyed = true

      this.unsubscribeColl.forEach(f => f())
      this.unsubscribeColl.length = 0

      if (this.childrenColl) {
        this.childrenColl.forEach(c => c.destroy())
        this.childrenColl = undefined
      }

      this.dom.remove()
    }
  }

  /*
   * 
   * Event handlers
   * 
   */

  onClick(callback: (event: MouseEvent) => void) {
    this.dom.addEventListener('click', callback)
    return this
  }

  onDoubleClick(callback: (event: MouseEvent) => void) {
    this.dom.addEventListener('dblclick', callback)
    return this
  }

  onMouseDown(callback: (event: MouseEvent) => void) {
    this.dom.addEventListener('mousedown', callback)
    return this
  }

  onKeyUp(callback: (event: KeyboardEvent) => void) {
    this.dom.addEventListener('keyup', callback)
    return this
  }

  onKeyDown(callback: (event: KeyboardEvent) => void) {
    this.dom.addEventListener('keydown', callback)
    return this
  }

  onBlur(callback: (event: FocusEvent) => void) {
    this.dom.addEventListener('blur', callback)
    return this
  }

  onFocus(callback: (event: FocusEvent) => void) {
    this.dom.addEventListener('focus', callback)
    return this
  }

  onInput(callback: (event: Event) => void) {
    this.dom.addEventListener('input', callback)
    return this
  }
}


/*
*
* vstack, hstack: div
*
**/

export type StackHAlign = 'left' | 'right' | 'center' | 'stretch'
export type StackVAlign = 'top' | 'center' | 'base' | 'bottom' | 'stretch'

export interface StackProps extends UIComponentProps {
  halign?: StackHAlign
  valign?: StackVAlign
}

export const vstackMapper = (s: StackProps) => {
  const halign = s.halign ?? 'left'
  const valign = s.valign ?? 'top'

  switch (halign) {
    case 'left':
      s.alignItems = 'flex-start'
      break
    case 'center':
      s.alignItems = 'center'
      break
    case 'right':
      s.alignItems = 'flex-end'
      break
    case 'stretch':
      s.alignItems = 'stretch'
      break
    default:
      s.alignItems = 'flex-start'
  }

  switch (valign) {
    case 'top':
      s.justifyContent = 'flex-start'
      break
    case 'center':
      s.justifyContent = 'center'
      break
    case 'base':
      s.alignItems = 'baseline'
      break
    case 'bottom':
      s.justifyContent = 'flex-end'
      break
    case 'stretch':
      s.justifyContent = 'space-between'
      break
    default:
      s.alignItems = 'flex-start'
  }
}

export const vstack = <P extends StackProps>() => {
  return new UIComponent<P>('div')
    .react(s => {
      s.display = 'flex'
      s.flexDirection = 'column'
      s.alignItems = 'flex-start'
      s.justifyContent = 'center'
      s.width = '100%'
      s.gap = '10px'
      s.boxSizing = 'border-box'
    })
    .map(vstackMapper)
}

export const hstackMapper = (s: StackProps) => {
  const halign = s.halign ?? 'left'
  const valign = s.valign ?? 'top'

  switch (halign) {
    case 'left':
      s.justifyContent = 'flex-start'
      break
    case 'center':
      s.justifyContent = 'center'
      break
    case 'right':
      s.justifyContent = 'flex-end'
      break
    case 'stretch':
      s.justifyContent = 'space-between'
      break
    default:
      s.alignItems = 'flex-start'
  }

  switch (valign) {
    case 'top':
      s.alignItems = 'flex-start'
      break
    case 'center':
      s.alignItems = 'center'
      break
    case 'base':
      s.alignItems = 'baseline'
      break
    case 'bottom':
      s.alignItems = 'flex-end'
      break
    case 'stretch':
      s.alignItems = 'stretch'
      break
    default:
      s.alignItems = 'flex-start'
  }
}

export const hstack = <P extends StackProps>() => {
  return new UIComponent<P>('div')
    .react(s => {
      s.display = 'flex'
      s.flexDirection = 'row'
      s.alignItems = 'flex-start'
      s.justifyContent = 'center'
      s.wrap = false
      s.boxSizing = 'border-box'
    })
    .map(hstackMapper)
}


/*
*
* Text: div, button, p, span, h1, h2, h3, h4, h5, h6
*
**/


export interface TextProps extends UIComponentProps {
  text?: string
  htmlText?: string
}

export class Text<P extends TextProps> extends UIComponent<P> {
  protected override didDomUpdate() {
    super.didDomUpdate()
    if (!this.childrenColl)
      this.dom.textContent = this.props.text ?? null
    if (this.props.htmlText !== undefined)
      this.dom.setHTMLUnsafe(this.props.htmlText)
  }
}

export const div = <P extends TextProps>() => {
  return new Text<P>('div')
}

export const p = <P extends TextProps>() => {
  return new Text<P>('p')
}

export const span = <P extends TextProps>() => {
  return new Text<P>('span')
}

export const h1 = <P extends TextProps>() => {
  return new Text<P>('h1')
}

export const h2 = <P extends TextProps>() => {
  return new Text<P>('h2')
}

export const h3 = <P extends TextProps>() => {
  return new Text<P>('h3')
}

export const h4 = <P extends TextProps>() => {
  return new Text<P>('h4')
}

export const h5 = <P extends TextProps>() => {
  return new Text<P>('h5')
}

export const h6 = <P extends TextProps>() => {
  return new Text<P>('h6')
}


/*
*
* Button: button
*
**/

export interface ButtonProps extends TextProps {
  isDisabled?: boolean
  isSelected?: boolean
  href?: string
}

export class Button<P extends ButtonProps> extends Text<P> {
  protected whenSelectedFn?: (state: P) => void
  whenSelected(fn: (state: P) => void) {
    this.whenSelectedFn = fn
    this.render('affectsProps')
    return this
  }

  protected whenDisabledFn?: (state: P) => void
  whenDisabled(fn: (state: P) => void) {
    this.whenDisabledFn = fn
    this.render('affectsProps')
    return this
  }

  protected override updateProps() {
    const res = {} as P
    this.reactions.forEach(fn => fn(res))

    const isSelected = res.isSelected
    const isDisabled = res.isDisabled

    if (this.whenSelectedFn && isSelected) {
      this.whenSelectedFn(res)
    }

    if (this.whenDisabledFn && isDisabled) {
      this.whenDisabledFn(res)
    }

    if (!isSelected && !isDisabled && this.whenHoveredFn) {
      if (!res.pseudo) res.pseudo = {} as Record<PseudoClassType, Record<string, any>>
      const state = {} as P
      this.whenHoveredFn(state)
      res.pseudo['hover'] = state
    }

    if (!this.childrenColl)
      this.dom.textContent = this.props.text ?? null

    if (this.mapStateFn) this.mapStateFn(res)
    this.props = res
    if (this.onPropsChangeSubscribers) this.onPropsChangeSubscribers.forEach(fn => fn(this.props))
  }

  protected override didDomUpdate(): void {
    super.didDomUpdate()
    this.props.href && this.dom.setAttribute('href', this.props.href)
  }
}

export const btn = <P extends ButtonProps>() => {
  return new Button<P>('button')
    .react(s => {
      s.textSelectable = false
    })
    .whenDisabled(s => {
      s.opacity = '0.5'
      s.cursor = 'not-allowed'
      s.mouseEnabled = false
    })
}

/*
*
* Link: a
*
**/

export interface LinkProps extends ButtonProps {
  href?: string
  target?: '_self' | '_blank' | '_parent'
}

export class LinkBtn<P extends LinkProps> extends Button<P> {
  protected override didDomUpdate(): void {
    super.didDomUpdate()
    this.props.href && this.dom.setAttribute('href', this.props.href)
    this.props.target && this.dom.setAttribute('target', this.props.target)
  }
}

export const link = <P extends LinkProps>() => {
  return new LinkBtn<P>('a')
    .react(s => {
      s.cursor = 'pointer'
    })
}

/*
*
* Switcher: button
*
**/

export interface SwitcherProps extends ButtonProps {
  trackWidth?: number
  trackHeight?: number
  trackColor?: string
  thumbColor?: string
  thumbDiameter?: number
}

export const switcher = () => {
  const $sharedState = new RXObservableValue<SwitcherProps>({})

  return btn<SwitcherProps>()
    .react(s => {
      s.trackWidth = 34
      s.trackHeight = 22
      s.trackColor = '#ffFFff'
      s.thumbColor = '#000000'
      s.thumbDiameter = 16
      s.minHeight = '0px'
      s.textSelectable = false
      s.cornerRadius = s.trackHeight + 'px'
      s.animate = 'background-color 300ms'
    })
    .whenSelected(s => {
      s.trackColor = '#aa0000'
      s.thumbColor = '#ffFFff'
    })
    .map(s => {
      s.bgColor = s.trackColor ?? '#ff0000'
      s.width = s.trackWidth + 'px'
      s.height = s.trackHeight + 'px'
    })
    .propsDidChange(props => $sharedState.value = props)
    .children(() => {
      //thumb
      div()
        .observe($sharedState)
        .react(s => {
          const ss = $sharedState.value
          const thumbDiameter = ss.thumbDiameter ?? 0
          const trackWidth = ss.trackWidth ?? 0
          const trackHeight = ss.trackHeight ?? 0
          const edgeOffset = (trackHeight - thumbDiameter) / 2

          s.bgColor = ss.thumbColor
          s.width = ss.thumbDiameter + 'px'
          s.height = ss.thumbDiameter + 'px'
          s.cornerRadius = ss.thumbDiameter + 'px'
          s.animateAll = '300ms'
          s.position = 'relative'
          s.top = '0'
          s.left = (ss.isSelected ? trackWidth - thumbDiameter - edgeOffset : edgeOffset) + 'px'
        })
    })
}


/*
*
* Observer
*
**/

class Observer<T> extends UIComponent<UIComponentProps> implements OnReceiver<T> {
  private hiddenElement: HTMLElement
  constructor() {
    super('p')
    this.hiddenElement = this.dom
    this.hiddenElement.hidden = true
  }

  override observe(rx: RXObservable<T, any>) {
    this.unsubscribeColl.push(
      rx.pipe()
        .debounce(0)
        .onReceive((v) => this.replaceDom(v))
        .subscribe()
    )
    return this
  }

  private instance?: AnyUIComponent
  private onReceiveFn?: (value: T) => AnyUIComponent | undefined | boolean
  onReceive(fn: (value: T) => AnyUIComponent | undefined | boolean) {
    this.onReceiveFn = fn
  }

  private replaceDom(value: T) {
    if (this.isDestroyed) return

    const p = UIComponent.activeParent
    UIComponent.activeParent = undefined
    const u = this.onReceiveFn?.(value)
    UIComponent.activeParent = p

    if (typeof u === 'object' && 'dom' in u) {
      this.dom.replaceWith(u.dom)
      this.instance?.destroy()
      this.instance = u
      this.dom = u.dom
    } else if (this.dom !== this.hiddenElement) {
      this.dom.replaceWith(this.hiddenElement)
      this.instance?.destroy()
      this.dom = this.hiddenElement
    }
  }

  protected override didDomUpdate(): void {
    super.didDomUpdate()
    if (this.instance && !this.instance.isDestroyed) {
      if (this.affectSet.has('affectsProps')) this.instance.render('affectsProps')
      if (this.affectSet.has('affectsChildrenProps')) this.instance.render('affectsChildrenProps')
    }
  }

  override destroy() {
    super.destroy()
    this.instance?.destroy()
  }
}

export interface OnReceiver<T> {
  onReceive(fn: (value: T) => AnyUIComponent | undefined | boolean): void
}

export const observer = <T>(rx: RXObservable<T, any>): OnReceiver<T> => {
  const res = new Observer<T>()
  res.observe(rx)
  return res
}

/*
*
* List: div
*
**/

export class List<T, P extends UIComponentProps> extends UIComponent<P> {
  constructor(tag: HtmlTag) {
    super(tag)
    this.childrenColl = []
  }

  private _itemsFn?: () => T[] = undefined
  items(fn: () => T[]) {
    this._itemsFn = fn
    this.render('recreateChildren')
    return this
  }

  private _itemRenderer: (item: T, index: number) => AnyUIComponent = (item: T) => p().react(state => state.text = item as string)
  itemRenderer(fn: (item: T, index: number) => AnyUIComponent) {
    this._itemRenderer = fn
    this.render('recreateChildren')
    return this
  }

  private _itemHashFn: (item: T) => any = (item) => item
  itemHash(fn: (item: T) => any) {
    this._itemHashFn = fn
    this.render('recreateChildren')
    return this
  }

  protected override updateDom() {
    if (this.isDestroyed) return
    if (!this.willDomUpdate) return

    this.willDomUpdate = false

    if (this.affectSet.has('affectsProps')) {
      this.updateProps()

      if (this.props.visible === false) {
        this.dom.hidden = true
        this.dom.className = ''
      } else {
        const cn = buildClassName(this.props, 'none')
        this.dom.className = cn
        this.dom.hidden = false
      }
    }

    if (this.affectSet.has('recreateChildren')) {
      this.recreateChildren()
    }

    if (this.affectSet.has('affectsChildrenProps')) {
      this.childrenColl?.forEach(c => c.render('affectsProps', 'affectsChildrenProps'))
    }

    if (this.affectSet.size > 0) {
      this.didDomUpdate()
      this.affectSet.clear()
    }
  }

  private _oldItemsHash: any[] = []
  private recreateChildren() {
    const actualItemsHash: any[] = []
    const actualItems = this._itemsFn ? [...this._itemsFn()] : []
    const actualChildren = []
    let index = 0
    if (!this.childrenColl) this.childrenColl = []

    while (index < actualItems.length) {
      const actualItem = actualItems[index]
      const actualItemHash = this._itemHashFn(actualItem)
      const oldVN = this.childrenColl[index]
      if (index < this._oldItemsHash.length) {
        if (actualItemHash === this._oldItemsHash[index]) {
          actualChildren.push(oldVN)
        } else {
          const newVN = this._itemRenderer(actualItem, index)
          oldVN.dom.replaceWith(newVN.dom)
          oldVN.destroy()
          actualChildren.push(newVN)
        }
      } else {
        const newVN = this._itemRenderer(actualItem, index)
        this.dom.appendChild(newVN.dom)
        actualChildren.push(newVN)
      }
      actualItemsHash.push(actualItemHash)
      index++
    }

    if (index < this.childrenColl.length) {
      this.childrenColl.slice(index).forEach(n => n.destroy())
    }
    this.childrenColl = actualChildren
    this._oldItemsHash = actualItemsHash
  }
}

export const vlist = <T>() => {
  return new List<T, StackProps>('div')
    .react(s => {
      s.display = 'flex'
      s.flexDirection = 'column'
      s.alignItems = 'flex-start'
      s.justifyContent = 'center'
      s.width = '100%'
      s.gap = '10px'
      s.boxSizing = 'border-box'
    })
    .map(vstackMapper)
}

export const hlist = <T>() => {
  return new List<T, StackProps>('div')
    .react(s => {
      s.display = 'flex'
      s.flexDirection = 'row'
      s.alignItems = 'flex-start'
      s.justifyContent = 'center'
      s.wrap = false
      s.boxSizing = 'border-box'
    })
    .map(hstackMapper)
}


/*
*
* Spacer: div
*
**/

export interface SpacerProps extends UIComponentProps {
  width?: string
  height?: string
  visible?: boolean
}

export const spacer = () => {
  return new UIComponent('div')
    .react(s => {
      s.flexGrow = 1
    })
    .map(s => {
      if (s.width?.includes('px')) {
        s.minWidth = s.width
        s.maxWidth = s.width
      }
      if (s.height?.includes('px')) {
        s.minHeight = s.height
        s.maxHeight = s.height
      }
    })
}


/*
*
* image
*
**/

export interface ImageProps extends UIComponentProps {
  src?: string
  alt?: string
}

export class Image<P extends ImageProps> extends Button<P> {
  protected override didDomUpdate(): void {
    super.didDomUpdate()
    this.props.src && this.dom.setAttribute('src', this.props.src)
    this.props.alt && this.dom.setAttribute('alt', this.props.alt)
  }
}

export const image = <P extends ImageProps>() => {
  return new Image<P>('img')
}


/*
*
* Input
*
**/


export type InputType = 'text' | 'number' | 'password' | 'email' | 'date' | 'datetime-local' | 'email' | 'file' | 'month' | 'week' | 'search' | 'time' | 'url'
export type InputMode = 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url'
export type TurnType = 'on' | 'off'

export interface InputProps extends UIComponentProps {
  type?: InputType
  inputMode?: InputMode
  value?: string
  maxLength?: string
  placeholder?: string
  caretColor?: string
  autoFocus?: boolean
  spellCheck?: boolean
  autoCorrect?: TurnType
  autoComplete?: TurnType
}

export class Input<P extends InputProps> extends UIComponent<P> {
  bind(rx: RXObservableValue<string>) {
    this.unsubscribeColl.push(
      rx.pipe()
        .onReceive(v => (this.dom as HTMLTextAreaElement).value = v)
        .subscribe())

    this.onInput((e: any) => rx.value = e.target.value)
    return this
  }

  protected whenFocusedFn?: (state: P) => void
  whenFocused(fn: (state: P) => void) {
    this.whenFocusedFn = fn
    this.render('affectsProps')
    return this
  }

  protected whenPlaceholderShownFn?: (state: P) => void
  whenPlaceholderShown(fn: (state: P) => void) {
    this.whenPlaceholderShownFn = fn
    this.render('affectsProps')
    return this
  }

  protected override updateProps() {
    const res = {} as P
    this.reactions.forEach(fn => fn(res))
    if (this.whenHoveredFn) {
      if (!res.pseudo) res.pseudo = {} as Record<PseudoClassType, Record<string, any>>
      const state = {} as P
      this.whenHoveredFn(state)
      res.pseudo['hover'] = state
    }

    if (this.whenFocusedFn) {
      if (!res.pseudo) res.pseudo = {} as Record<PseudoClassType, Record<string, any>>
      const state = {} as P
      this.whenFocusedFn(state)
      res.pseudo['focus'] = state
    }

    if (this.whenPlaceholderShownFn) {
      if (!res.pseudo) res.pseudo = {} as Record<PseudoClassType, Record<string, any>>
      const state = {} as P
      this.whenPlaceholderShownFn(state)
      res.pseudo['placeholder'] = state
    }

    if (this.mapStateFn) this.mapStateFn(res)
    this.props = res
    if (this.onPropsChangeSubscribers) this.onPropsChangeSubscribers.forEach(fn => fn(this.props))
  }

  protected override didDomUpdate(): void {
    super.didDomUpdate();
    this.props.placeholder && this.dom.setAttribute('placeholder', this.props.placeholder)
    this.props.autoCorrect && this.dom.setAttribute('autoCorrect', this.props.autoCorrect)
    this.props.autoComplete && this.dom.setAttribute('autoComplete', this.props.autoComplete)
    this.props.type && this.dom.setAttribute('type', this.props.type)
    this.props.inputMode && this.dom.setAttribute('inputMode', this.props.inputMode)
    this.props.maxLength && this.dom.setAttribute('maxLength', this.props.maxLength)
    this.props.caretColor && this.dom.setAttribute('caretColor', this.props.caretColor)
    this.dom.spellcheck = this.props.spellCheck ?? false
    if (this.props.autoFocus) this.dom.focus()
  }
}

export const input = <P extends InputProps>(type: InputType = 'text') => {
  return new Input<P>('input').react(s => s.type = type)
}

export const textarea = <P extends InputProps>() => {
  return new Input<P>('textarea').react(s => s.type = 'text')
}
