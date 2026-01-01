import { PseudoClassType, StyleSheetProcessor } from './processor'

interface RuleBuilderInterface {
  reset: (pseudoClass: PseudoClassType, rulePriority: RulePriority) => void
  operator: Record<string, (value: any) => void>
  getClassName: (tag: string) => string
  addRule: (parentSelector: string, childSelector: string) => void
}

export type RulePriority = 'high' | 'low'
const RuleBuilder = (): RuleBuilderInterface => {
  //const notAllowedSymbolsInClassName = /[%. ()/#"]+/g
  const classNameHash = new Map<string, string>()
  let classNameHashVolume = 0

  // Creating of dynamic stylesheets are enabled only in Chrome (23.06.2023)
  // const styleSheet = new CSSStyleSheet();
  // document.adoptedStyleSheets = [styleSheet];
  const styleSheet = window.document.styleSheets[0]
  if (!styleSheet) console.error('RuleBuilder:: window.document.styleSheets[0] returned undefined!')

  const styleSheetProcessor = new StyleSheetProcessor(styleSheet)
  let pseudoClass: PseudoClassType = 'none'
  let rulePriority: RulePriority = 'low'

  const operator: Record<string, (value: any) => void> = Object.create(null)

  const reset = (pseudoClassValue: PseudoClassType, rulePriorityValue: RulePriority): void => {
    styleSheetProcessor.clearValues()
    pseudoClass = pseudoClassValue
    rulePriority = rulePriorityValue
  }

  const getClassName = (tag: string): string => {
    const hashSum = styleSheetProcessor.valuesToHashSum()
    if (!hashSum) return ''

    if (classNameHash.has(hashSum)) {
      return classNameHash.get(hashSum) as string
    } else {
      const className = 'cn' + classNameHashVolume.toString(36)
      classNameHash.set(hashSum, className)
      classNameHashVolume++
      classNameHashVolume % 100 === 0 && console.log('Total css selectors:', classNameHashVolume)
      styleSheetProcessor.insertRule(className, tag)
      return className
    }
  }

  const addRule = (parentSelector: string, childTagSelector: string): void => {
    const hashSum = styleSheetProcessor.valuesToHashSum()
    if (!hashSum) return

    const selector = parentSelector + ' ' + childTagSelector
    if (classNameHash.has(selector)) return

    styleSheetProcessor.insertRule(selector, '')
  }

  const setValue = (key: string, value: string, appendToClassSelectorName: boolean = true) => {
    if (value === undefined) return

    styleSheetProcessor.setValue(pseudoClass, key, value, rulePriority, appendToClassSelectorName)
  }

  operator.width = (value: string) => { setValue('width', value) }
  operator.height = (value: string) => { setValue('height', value) }
  operator.minHeight = (value: string) => { setValue('min-height', value) }
  operator.maxHeight = (value: string) => { setValue('max-height', value) }
  operator.minWidth = (value: string) => { setValue('min-width', value) }
  operator.maxWidth = (value: string) => { setValue('max-width', value) }
  operator.left = (value: string) => { setValue('left', value) }
  operator.right = (value: string) => { setValue('right', value) }
  operator.top = (value: string) => { setValue('top', value) }
  operator.bottom = (value: string) => { setValue('bottom', value) }

  operator.display = (value: string) => { setValue('display', value) }

  operator.paddingLeft = (value: string) => { setValue('padding-left', value) }
  operator.paddingRight = (value: string) => { setValue('padding-right', value) }
  operator.paddingHorizontal = (value: string) => {
    setValue('padding-left', value)
    setValue('padding-right', value)
  }
  operator.paddingTop = (value: string) => { setValue('padding-top', value) }
  operator.paddingBottom = (value: string) => { setValue('padding-bottom', value) }
  operator.paddingVertical = (value: string) => {
    setValue('padding-top', value)
    setValue('padding-bottom', value)
  }
  operator.padding = (value: string) => { setValue('padding', value) }

  operator.layer = (value: string) => { setValue('z-index', value) }
  operator.position = (value: string) => { setValue('position', value) }
  operator.mouseEnabled = (value: string) => { setValue('pointer-events', value ? 'auto' : 'none') }
  operator.pointerEvents = (value: string) => { setValue('pointer-events', value) }
  operator.enableOwnScroller = (value: boolean) => { setValue('overflow-y', value ? 'auto' : 'hidden') }
  operator.disableScroll = (value: boolean) => { value && setValue('overflow', 'hidden') }
  operator.disableHorizontalScroll = (value: boolean) => { value && setValue('overflow-x', 'hidden') }
  operator.cursor = (value: string) => { value && setValue('cursor', value) }

  operator.boxSizing = (value: string) => {
    setValue('box-sizing', value)
    setValue('-webkit-box-sizing', value, false)
    setValue('-moz-box-sizing', value, false)
  }

  operator.display = (value: string) => { setValue('display', value) }
  operator.gap = (value: string) => { setValue('gap', value) }
  operator.flexDirection = (value: string) => { setValue('flex-direction', value) }
  operator.flexGrow = (value: string) => { setValue('flex-grow', value) }
  operator.flexShrink = (value: string) => { setValue('flex-shrink', value) }
  operator.wrap = (value: string) => { value && setValue('flex-wrap', 'wrap') }
  operator.alignItems = (value: string) => { setValue('align-items', value) }
  operator.justifyContent = (value: string) => { setValue('justify-content', value) }
  operator.margin = (value: string) => { setValue('margin', value) }
  operator.marginLeft = (value: string) => { setValue('margin-left', value) }
  operator.marginRight = (value: string) => { setValue('margin-right', value) }
  operator.marginTop = (value: string) => { setValue('margin-top', value) }
  operator.marginBottom = (value: string) => { setValue('margin-bottom', value) }
  operator.marginHorizontal = (value: string) => {
    setValue('margin-left', value)
    setValue('margin-right', value)
  }
  operator.marginVertical = (value: string) => {
    setValue('margin-top', value)
    setValue('margin-bottom', value)
  }

  operator.blur = (value: string) => { setValue('backdrop-filter', 'blur(' + value + ')') }

  operator.outline = (value: string | [string, string, string]) => { setValue('outline', Array.isArray(value) ? value.join(' ') : value) }
  operator.bgColor = (value: string) => { setValue('background-color', value) }
  operator.borderColor = (value: string) => { setValue('border', '1px ' + 'solid ' + value) }
  operator.border = (value: string | [string, string, string]) => { setValue('border', Array.isArray(value) ? value.join(' ') : value) }
  operator.borderLeft = (value: string | [string, string, string]) => { setValue('border-left', Array.isArray(value) ? value.join(' ') : value) }
  operator.borderRight = (value: string | [string, string, string]) => { setValue('border-right', Array.isArray(value) ? value.join(' ') : value) }
  operator.borderTop = (value: string | [string, string, string]) => { setValue('border-top', Array.isArray(value) ? value.join(' ') : value) }
  operator.borderBottom = (value: string | [string, string, string]) => { setValue('border-bottom', Array.isArray(value) ? value.join(' ') : value) }
  operator.content = (value: string) => { setValue('content', value) }
  operator.cornerRadius = (value: string) => { setValue('border-radius', value) }
  operator.opacity = (value: string) => { setValue('opacity', value) }
  operator.shadow = (value: string) => { setValue('box-shadow', value) }
  operator.textShadow = (value: string) => { setValue('text-shadow', value) }

  operator.fontFamily = (value: string) => { setValue('font-family', value) }
  operator.fontSize = (value: string) => { setValue('font-size', value) }
  operator.fontWeight = (value: string) => { setValue('font-weight', value) }
  operator.fontStyle = (value: string) => { setValue('font-style', value) }
  operator.lineHeight = (value: string) => { setValue('line-height', value) }
  operator.letterSpacing = (value: string) => { setValue('letter-spacing', value) }
  operator.textColor = (value: string) => { setValue('color', value) }
  operator.textAlign = (value: string) => { setValue('text-align', value) }
  operator.textDecoration = (value: string) => { setValue('text-decoration', value) }
  operator.transform = (value: string) => { setValue('transform', value) }
  operator.textIndent = (value: string) => { setValue('text-indent', value) }
  operator.textTransform = (value: string) => { setValue('text-transform', value) }
  operator.whiteSpace = (value: string) => { setValue('white-space', value) }
  operator.caretColor = (value: string) => { setValue('caret-color', value) }
  operator.overflow = (value: string) => { setValue('overflow', value) }
  operator.textOverflow = (value: string) => { setValue('text-overflow', value) }
  operator.textSelectable = (value: boolean) => {
    setValue('user-select', value ? 'text' : 'none')
    setValue('-webkit-user-select', value ? 'text' : 'none', false)
  }

  operator.target = (value: string) => { setValue('target', value) }

  operator.bgImage = (value: string) => { setValue('background-image', value) }
  operator.bgImageSrc = (value: string) => { setValue('background-image', 'url(' + value + ')') }
  operator.bgImageRepeat = (value: string) => { setValue('background-repeat', value) }
  operator.bgImageSize = (value: string) => { setValue('background-size', value) }
  operator.bgImageAttachment = (value: string) => { setValue('background-attachment', value) }

  operator.animate = (value: string) => { setValue('transition', value) }
  operator.animateAll = (value: string) => { setValue('transition', 'all ' + value) }

  operator.pseudo = (values: Record<PseudoClassType, Record<string, any>>) => {
    for (const [p, pseudoProps] of Object.entries(values)) {
      pseudoClass = p as PseudoClassType
      for (const k of [...Object.keys(pseudoProps)].sort(sortKeys)) {
        if (operator[k]) {
          operator[k](pseudoProps[k])
        }
      }
    }
    pseudoClass = 'none'
  }

  return { reset, operator, getClassName, addRule }
}

const ruleBuilder = RuleBuilder()

const sortKeys = (a: string, b: string) => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export const buildClassName = (props: any, pc: PseudoClassType, tag = ''): string => {
  const { reset, operator, getClassName } = ruleBuilder
  reset(pc, 'high')

  for (const k of [...Object.keys(props)].sort(sortKeys)) {
    if (operator[k]) {
      operator[k](props[k])
    }
  }
  return 'className' in props && props.className ? props.className + ' ' + getClassName(tag) : getClassName(tag)
}

export const buildRule = (props: any, parentSelector: string, childSelector: string, pc: PseudoClassType = 'none'): void => {
  const { reset, operator, addRule } = ruleBuilder
  reset(pc, 'low')

  for (const k of [...Object.keys(props)].sort(sortKeys)) {
    if (operator[k]) {
      operator[k](props[k])
    }
  }
  addRule(parentSelector, childSelector)
}

export type BorderStyle = 'solid' | 'dotted' | 'dashed' | 'double' | 'none' | 'hidden'
export type PointerEventsStyle = 'auto' | 'none' | 'visiblePainted' | 'visibleFill' | 'visibleStroke' | 'visible' | 'painted' | 'fill' | 'stroke' | 'all' | 'inherit' | 'initial' | 'unset'
export type FontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'inherit'

export interface UIComponentProps {
  alignItems?: 'normal' | 'stretch' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'baseline' | 'inherit'
  animate?: string //'background-color 300ms'
  animateAll?: string //'300ms'
  bgColor?: string
  bgImageAttachment?: 'scroll' | 'fixed' | 'unset' | 'inherit'
  bgImageRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y' | 'unset' | 'space' | 'inherit'
  bgImageSize?: 'cover' | 'contain' | 'auto' | 'inherit'
  bgImageSrc?: string
  bgImage?: string
  blur?: string //15px
  borderColor?: string
  border?: string | [string, BorderStyle, string]
  borderBottom?: string | [string, BorderStyle, string]
  borderLeft?: string | [string, BorderStyle, string]
  borderRight?: string | [string, BorderStyle, string]
  borderTop?: string | [string, BorderStyle, string]
  bottom?: string
  boxSizing?: 'border-box' | 'content-box' | 'inherit'
  caretColor?: string
  children?: any
  className?: string
  cornerRadius?: string
  content?: string
  cursor?: 'auto' | 'pointer' | 'wait' | 'crosshair' | 'not-allowed' | 'zoom-in' | 'grab' | 'inherit'
  disableHorizontalScroll?: boolean
  disableScroll?: boolean
  display?: 'none' | 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'inherit'
  enableOwnScroller?: boolean
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse' | 'inherit'
  flexGrow?: number
  fontFamily?: string
  fontSize?: string
  fontStyle?: 'normal' | 'italic' | 'inherit'
  fontWeight?: FontWeight
  gap?: string
  height?: string
  id?: string
  justifyContent?: 'normal' | 'stretch' | 'start' | 'center' | 'end' | 'flex-start' | 'flex-end' | 'left' | 'right' | 'space-between' | 'space-around' | 'inherit'
  keyValue?: string
  layer?: string //z-index
  left?: string
  letterSpacing?: string
  lineHeight?: string
  maxHeight?: string
  maxWidth?: string
  margin?: string
  marginBottom?: string
  marginHorizontal?: string
  marginLeft?: string
  marginRight?: string
  marginTop?: string
  marginVertical?: string
  mouseEnabled?: boolean
  minHeight?: string
  minWidth?: string
  opacity?: string
  outline?: string | [string, string, string]
  overflow?: 'auto' | 'hidden' | 'clip' | 'inherit'
  padding?: string
  paddingBottom?: string
  paddingHorizontal?: string
  paddingLeft?: string
  paddingRight?: string
  paddingTop?: string
  paddingVertical?: string
  position?: 'static' | 'absolute' | 'relative' | 'fixed' | 'sticky' | 'inherit'
  popUp?: string
  right?: string
  shadow?: string // offset-x | offset-y | blur-radius | spread-radius | color
  textAlign?: 'left' | 'right' | 'center' | 'justify' | 'inherit'
  textColor?: string
  textDecoration?: 'none' | 'underline' | 'inherit'
  textIndent?: string
  textTransform?: 'none' | 'uppercase' | 'capitalize' | 'lowercase' | 'inherit'
  textShadow?: string //offset-x | offset-y | blur-radius | color
  textOverflow?: 'auto' | 'ellipsis' | 'clip' | 'fade' | 'inherit'
  textSelectable?: boolean
  transform?: string
  top?: string
  visible?: boolean
  whiteSpace?: 'normal' | 'pre' | 'pre-wrap' | 'nowrap' | 'inherit'
  width?: string
  wrap?: boolean
  pseudo?: Record<PseudoClassType, Record<string, any>>
} 