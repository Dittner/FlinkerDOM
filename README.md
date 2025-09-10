## Intro
__FlinkerDom__ (FD) is a TypeScript library for building user interfaces and single-page web-applications.

__FD__
+ uses all the power and flexibility of the [Flinker](https://github.com/Dittner/Flinker) FRP;

+ does not use a virtual DOM;

+ does not use TSX/JSX-files;

+ uses dynamic CSS rules and CSS selectors caching, does not generate Inline Styles;

+ is focused on updating each ui-component that is subscribed to changes of the RXObservable object.

## Getting Started
1. Install vite and create vanilla-ts template project:
```cli
npm create vite@latest project-name -- --template vanilla-ts
```

2. Update package.json:
```json
"dependencies": {
    "flinker": "^2.0.4",
    "flinker-dom": "^1.0.4"
}
```

3. Install dependencies:
```cli
npm install
```

4. Let's write our simple application:
```html
<!-- index.html-->
<!DOCTYPE html>
<html lang="en">
  <head>
    ...
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.ts"></script>
  </body>
</html>
```

```ts
// index.ts
import './index.css'
import { App } from './App'

const app = App()
document.getElementById('root')!.appendChild(app.dom)

// App.ts
import { p } from 'flinker-dom'

export const App = () => {
  return p().react(s => s.text = 'Hello, Flinker!')
}
```

## Example 1: Counter
```ts
import { RXObservableValue } from 'flinker'
import { p, div, btn } from 'flinker-dom'

const Counter = () => {
  // The function Counter will not be re-called by renderings.
  // Therefore we can declare any functions and states
  // in the Counter() body.
  const rx = new RXObservableValue(0)
  
  return div().children(() => {
    p()
      .observe(rx) // subscription to RXObservable object
      .react(s => {
        // react function will be called
        // after the state (rx) changes
        s.text = 'Count: ' + rx.value
        s.textColor = '#222222'
      })

    // btn will not be re-rendered,
    // because it is not subscribed to external state
    btn()
      .react(s => {
        s.text = 'Inc'
        s.textColor = '#ffFFff'
        s.bgColor = '#222222'
        s.cornerRadius = '4px'
        s.padding = '10px'
      })
      .whenHovered(s => {
        s.bgColor = '#444444'
      })
      .onClick(() => rx.value++)
  })
}
```

As a rule, we do not use attributes of functional components to specify properties. This example is incorrect:
```ts
const Component = (props: { text: string, textColor: string }) => {
  return p().react(s => {
    s.text = props.text
    s.textColor = props.textColor
  })
}
```

But we can use observable objects (RXObservable):
```ts
const Counter = (rx: RXObservableValue<number>) => {
  return p()
    .observe(rx)
    .react(s => ... )
}

const $state = new RXObservableValue(0)
Counter($state)
```

## Example 2: Inheritance
In order not to duplicate the style of our buttons, we must describe the style once with the ability to specify only the text prop and add handlers later.

```ts
// Buttons.ts
export const ToggleBtn = ($isSelected: RXObservableValue<boolean>) => {
  return btn()
    .observe($isSelected)
    .react(s => {
      s.isSelected = $isSelected.value
      s.textColor = '#ffFFff'
      s.bgColor = '#222222'
      s.cornerRadius = '5px'
      s.padding = '10px'
    })
    .whenHovered(s => {
      s.textColor = '#cc2222'
    })
    .whenSelected(s => {
      s.bgColor = '#cc2222'
    })
    .onClick(() => {
      $isSelected.value = !$isSelected.value
    })
}

// Settings.ts
export class Settings {
  readonly $rememberMe = new RXObservableValue(false)
  
  constructor() {
    this.$rememberMe.pipe()
      .skipFirst() // ignore default false value
      .onReceive(_ => {
        this.storeSettings()
      })
      .subscribe()
  }
  
  private storeSettings() {
    ...
  }
}

// App.ts
const settings = new Settings()

const SettingsView = () => {
  return vstack().children(() => {
    ToggleBtn(settings.$rememberMe)
      .react(s => s.text = 'Remember me')
  })
}
```

## Example 3: Custom component
Let's create a button that has an icon and label.

```ts
// Buttons.ts
import { btn, ButtonProps } from 'flinker-dom'

export interface IconBtnProps extends ButtonProps {
  icon?: MaterialIcon
  iconSize?: string
}

export const IconBtn = () => {
  const $sharedState = new RXObservableValue<IconBtnProps>({})
  return btn<IconBtnProps>()
    // using propsDidChange handler,
    // we can share btn-state to its children-components
    .propsDidChange(props => $sharedState.value = props)
    .react(s => {
      s.display = 'flex'
      s.flexDirection = 'row'
      s.alignItems = 'center'
      s.justifyContent = 'center'
      s.gap = '5px'
      s.wrap = false
      s.boxSizing = 'border-box'
    })
    .children(() => {

      //icon
      $sharedState.value.icon && Icon()
        .observe($sharedState) // subscription to the sharedState
        .react(s => {
          const ss = $sharedState.value
          if (ss.icon) s.value = ss.icon
          if (ss.iconSize) s.fontSize = ss.iconSize
          s.textColor = 'inherit'
        })

      //label
      $sharedState.value.text && span()
        .observe($sharedState)
        .react(s => {
          const ss = $sharedState.value
          s.text = ss.text
          s.textColor = 'inherit'
          s.fontSize = 'inherit'
          s.fontFamily = 'inherit'
        })
    })
}
```

In the example above we have used Icon as MaterialIcon:

```ts
// Icons.ts
export interface IconProps extends TextProps {
  value?: MaterialIcon
}

export const Icon = <P extends IconProps>() => {
  return span<P>()
    .react(s => {
      s.value = MaterialIcon.question_mark // default icon
      s.className = 'material_icon'
      s.textSelectable = false
    })
    .map(s => s.text = s.value) // is called after all react-functions
}

export enum MaterialIcon {
  av_timer = 'av_timer',
  autorenew = 'autorenew',
  autofps_select = 'autofps_select',
  auto_stories = 'auto_stories',
  ...
  zoom_out_map = 'zoom_out_map',
  zoom_out = 'zoom_out',
  zoom_in_map = 'zoom_in_map',
  zoom_in = 'zoom_in',
}

// index.css
@font-face {
  font-family: 'MaterialIcons';
  font-style: normal;
  font-weight: 400;
  src: url('resources/fonts/MaterialIcons.ttf') format('truetype');
}

.material_icon {
  font-family: 'MaterialIcons';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;  /* Preferred icon size */
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;

  /* Support for all WebKit browsers. */
  -webkit-font-smoothing: antialiased;
  /* Support for Safari and Chrome. */
  text-rendering: optimizeLegibility;

  /* Support for Firefox. */
  -moz-osx-font-smoothing: grayscale;

  /* Support for IE. */
  -webkit-font-feature-settings: 'liga';
}
```

As a result:

```ts
// App.ts
IconBtn()
  .react(s => {
    s.icon = MaterialIcon.add
    s.text = 'Btn with icon'
    s.textColor = '#ffFFff'
    s.bgColor = '#111111'
    s.cornerRadius = '5px'
    s.padding = '10px'
  })
  .whenHovered(s => {
    s.textColor = '#cc2222'
    s.bgColor = '#222222'
  })
```

## Example 4: List
Lists manages re-rendering of its components. If we add to the end of the list a new component, the previous ones will not be re-created or re-rendered.

Let's create a simple ToDo App. 

```ts
// Model.ts
export interface Task {
  id: number
  text: string
}

export class ToDoModel {
  readonly $tasks = new RXSubject<Task[], never>([])

  private lastTaskId = 0
  createTask(text: string) {
    this.$tasks.value.push({ id: this.lastTaskId++, text })
    this.$tasks.resend()
    // using resend-method, all subscribers to the $tasks
    // will be notified even if the $tasks.value remains the same.
    // Therefore we are using RXSubject instead of RXObservableValue
  }
}
```

Our view contains a list of tasks:

```ts
// App.ts
const model = new ToDoModel()

const TodoList = () => {
  return vstack().children(() => {
    vlist<Task>()
      .observe(model.$tasks)
      .items(() => model.$tasks.value) // will be re-called if model.$tasks changes
      .itemRenderer(TaskView)

    btn()
      .react(s => {
        s.bgColor = '#222222'
        s.padding = '10px'
        s.cornerRadius = '4px'
        s.text = '+ New Task'
      })
      .onClick(() => {
        model.createTask('New Task')
      })
    })
}

const TaskView = (t: Task) => {
  return p()
    .react(s => s.text = t.text)
}
```

When model.$tasks changes vlist call items function to get tasks. Then vlist compares two lists of the tasks before and after changes. If different items are found for the same index, the previous component will be removed from the dom-tree and the new one will be added. By default, strict equality (===) is used to compare two elements. We can override this behavior, using equals method:

```ts
vlist<Task>()
  .observe(model.$tasks)
  .items(() => model.$tasks.value)
  .equals((a, b) => a.id === b.id)
  .itemRenderer(TaskView)
```

Vlist can be stylized as vstack:
```ts
vlist<Task>()
  .observe(model.$tasks)
  .items(() => model.$tasks.value)
  .itemRenderer(TaskView)
  .react(s => {
    s.width = '100%'
    s.halign = 'left'
    s.valign = 'center'
    s.gap = '10px'
    s.padding = '20px'
  })
```

## Example 5: Affects
By observing changes we can clearly specify what reactions (ObserveAffect) should follow. We have three types of affects:

+ __affectsProps__ (default) — only styles and props of the component will be updated, that has called an `observe`-method;
+ __affectsChildrenProps__ — styles and props of the component's children will be updated including their children;
+ __recreateChildren__ — old children will be removed from the dom-tree, and new ones will be added.

### affectsChildrenProps case
There are states of change that affect only the properties and styles of nested components, not the structure. In this case, to avoid having to subscribe to changes in each child component, you can subscribe only in the parent one, specifying the affectsChildrenProps-affect. The application theme can act as such a state.

```ts
export const App = () => {
  const $theme = globalContext().app.$theme
  
  return HomeView()
    .observe($theme, 'affectsProps', 'affectsChildrenProps')
}
```

Components support multiple observing, so we could write it like this:
```ts
HomeView()
  .observe($theme, 'affectsProps')
  .observe($theme, 'affectsChildrenProps')
```

### recreateChildren case
Let's imagine that the user selects a document to view. Depending on the document, we may have different components structure. Therefore, we have to recreate the child components entirely.

```ts
const DocView = () => {
  const ctx = docContext()

  return vstack()
    .observe(ctx.$selectedDoc, 'recreateChildren')
    .react(s => {
      s.textColor = theme().text
      s.gap = '0'
      s.valign = 'top'
      s.halign = 'left'
      s.paddingVertical = '40px'
      s.width = '100%'
    }).children(() => {
      // we always get an actual doc hier, 
      // since the children() method will be called
      // every time $selectedDoc changes
      const doc = ctx.$selectedDoc.value

      DocInfo(doc)
      DocHeader(doc)
      DocBody(doc)
      
      doc.isEditing && ToolBar(doc)
    })
}
```

If selectedDoc can be undefined, then we usually use the `observer` component:

```ts
const DocView = ($doc: RXObservableValue<Doc | undefined>) => {
  return observer($doc).onReceive(doc => {
    return doc && vstack()
      .react(s => ...)
      .children(() => {

        DocInfo(doc)
        DocHeader(doc)
        DocBody(doc)

        doc.isEditing && ToolBar(doc)
      })
  })
}
```

## Example 6: Input
input and textarea components use binding mechanism for bidirectional text updating:

```ts
const TextInput = ($input: RXObservableValue<string>) => {
  return input()
        .bind($input)
        .react(s => {
          // react will not be re-called if $input changes
          s.type = 'text'
          s.width = '100%'
          s.height = '40px'
          s.fontSize = theme().defFontSize
          s.textColor = theme().text
          s.bgColor = theme().inputBg
          s.padding = '10px'
          s.autoCorrect = 'off'
          s.autoComplete = 'off'
          s.borderBottom = '1px solid ' + theme().violet
        })
        .whenFocused(s => {
          s.borderBottom = '1px solid ' + theme().red
        })
        .whenPlaceholderShown(s => {
          s.textColor = '#666666'
        })
}
```

How is binding implemented?
```ts
// FlinkerDom/src/components.ts
export class Input<P extends InputProps> extends UIComponent<P> {
  bind(rx: RXObservableValue<string>) {
    this.unsubscribeColl.push(
      rx.pipe()
        .onReceive(v => (this.dom as HTMLTextAreaElement).value = v)
        .subscribe()
    )

    this.onInput((e: any) => rx.value = e.target.value)
    return this
  }
  ...
  
  onInput(callback: (event: Event) => void) {
    this.dom.addEventListener('input', callback)
    return this
  }
}

export const input = <P extends InputProps>(type: InputType = 'text') => {
  return new Input<P>('input').react(s => s.type = type)
}

export const textarea = <P extends InputProps>() => {
  return new Input<P>('textarea').react(s => s.type = 'text')
}
```

## List of standard components (v.1.0):
+ div
+ p
+ span
+ h1
+ h2
+ h3
+ h4
+ h5
+ h6
+ btn
+ link (a)
+ switcher (div)
+ observer (p hidden)
+ vstack (div)
+ hstack (div)
+ vlist (div)
+ hlist (div)
+ spacer (div)
+ image
+ input
+ textarea

## Install
```cli
npm i flinker-dom
```

## License
MIT