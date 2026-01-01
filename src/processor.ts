import { type RulePriority } from './core';

const abbreviations: Record<string, string> = {
  'align-items': 'A',
  'backdrop-filter': 'BF',
  'background-color': 'BG',
  'background-image': 'BI',
  'background-attachment': 'BIA',
  'background-repeat': 'BIR',
  'background-size': 'BIS',
  'border': 'BO',
  'border-left': 'BL',
  'border-right': 'BR',
  'border-top': 'BT',
  'border-bottom': 'BB',
  'border-radius': 'BRA',
  'bottom': 'B',
  'box-sizing': 'S',
  'box-shadow': 'BS',
  'caret-color': 'CC',
  'color': 'C',
  'content': 'CO',
  'cursor': 'CU',
  'display': 'D',
  'flex-direction': 'F',
  'flex-grow': 'FG',
  'flex-wrap': 'FR',
  'flex-shrink': 'FK',
  'font-family': 'FF',
  'font-size': 'FS',
  'font-style': 'FST',
  'font-weight': 'FW',
  'gap': 'G',
  'height': 'H',
  'justify-content': 'J',
  'left': 'L',
  'letter-spacing': 'LS',
  'line-height': 'LH',
  'margin': 'M',
  'margin-left': 'ML',
  'margin-right': 'MR',
  'margin-top': 'MT',
  'margin-bottom': 'MB',
  'max-height': 'MAH',
  'max-width': 'MAW',
  'min-height': 'MIH',
  'min-width': 'MIW',
  'opacity': 'OP',
  'overflow': 'O',
  'overflow-x': 'OX',
  'overflow-y': 'OY',
  'outline': 'OL',
  'padding': 'P',
  'padding-left': 'PL',
  'padding-right': 'PR',
  'padding-top': 'PT',
  'padding-bottom': 'PB',
  'pointer-events': 'PE',
  'position': 'PO',
  'right': 'R',
  'target': 'TA',
  'text-align': 'TAL',
  'text-decoration': 'TD',
  'transform': 'TRA',
  'text-indent': 'TI',
  'text-transform': 'TR',
  'text-shadow': 'TS',
  'text-overflow': 'TO',
  'top': 'T',
  'transition': 'TN',
  'white-space': 'WS',
  'width': 'W',
  'user-select': 'U',
  'z-index': 'Z'
}

const pseudoClasses = ['none', ':hover', ':focus', '::placeholder', '::before'] as const
export type PseudoClassType = typeof pseudoClasses[number];

export class StyleSheetProcessor {
  private readonly hash = new Map<PseudoClassType, PseudoClass>()
  private readonly list = Array.of<PseudoClass>()
  static echo = false

  constructor(styleSheet: CSSStyleSheet) {
    pseudoClasses.forEach(t => {
      if (t === ':hover') {
        const pc = new HoverPseudoClass(styleSheet)
        this.hash.set(':hover', pc)
        this.list.push(pc)
      } else {
        const pc = new PseudoClass(t, styleSheet)
        this.hash.set(t, pc)
        this.list.push(pc)
      }
    })
  }

  setValue(to: PseudoClassType, key: string, value: string, priority: RulePriority, appendToClassName: boolean = true) {
    const pseudoClass = this.hash.get(to)
    if (pseudoClass) {
      pseudoClass.setValue(key, value, priority, appendToClassName)
    } else {
      throw new Error('PseudoClassProcessor:setValue, PseudoClassType <' + to + '> not added to PseudoClassProcessor')
    }
  }

  valuesToHashSum() {
    return this.list.reduce((res, pseudoClass) => (res + (pseudoClass.isEmpty() ? '' : pseudoClass.hashSum)), '')
  }

  insertRule(className: string, tag: string) {
    this.list.forEach(c => { c.insertRule(className, tag) })
  }

  clearValues() {
    this.list.forEach(c => { c.clear() })
  }
}

export class PseudoClass {
  readonly type: PseudoClassType
  readonly styleSheet: CSSStyleSheet
  style: string
  hashSum: string
  constructor(type: PseudoClassType, styleSheet: CSSStyleSheet) {
    this.type = type
    this.styleSheet = styleSheet
    this.style = ''
    this.hashSum = ''
  }

  insertRule(className: string, tag: string) {
    if (this.style) {
      const rule = tag + '.' + className + (this.type === 'none' ? '' : this.type) + '{' + this.style + '}'
      this.styleSheet.insertRule(rule)
      if (StyleSheetProcessor.echo) console.log(`StyleSheetProcessor: new rule: ${rule}`)
    }
  }

  setValue(key: string, value: string, priority: RulePriority, appendToClassName: boolean = true) {
    if (value === undefined) return

    this.style += key + ':' + value + (priority === 'high' ? ' !important;' : ';')

    if (appendToClassName) {
      if (!(key in abbreviations)) { throw new Error('SelectorRuleBuilder.setValue:: No abbreviation for tag: ' + key) }
      this.hashSum += abbreviations[key] + value
    }
  }

  isEmpty(): boolean {
    return this.style.length === 0
  }

  clear() {
    this.hashSum = this.type !== 'none' ? this.type.toUpperCase() : ''
    this.style = ''
  }
}

class HoverPseudoClass extends PseudoClass {
  readonly isMobileDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0)

  constructor(styleSheet: CSSStyleSheet) {
    super(':hover', styleSheet)
  }

  insertRule(className: string, tag: string) {
    if (this.style) {
      const rule = tag + '.' + className + (this.isMobileDevice ? ':active{' : ':hover{') + this.style + '}'
      this.styleSheet.insertRule(rule)
    }
  }
}
