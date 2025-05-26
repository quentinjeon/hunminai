import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface ValidationIssue {
  type: string
  severity: 'error' | 'warning' | 'suggestion'
  message: string
  position: {
    start: number
    end: number
  }
}

export interface ValidationHighlightOptions {
  HTMLAttributes: Record<string, any>
  issues: ValidationIssue[]
  onIssueClick?: (issue: ValidationIssue) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    validationHighlight: {
      /**
       * Set validation issues for highlighting
       */
      setValidationIssues: (issues: ValidationIssue[]) => ReturnType
      /**
       * Clear all validation highlights
       */
      clearValidationHighlights: () => ReturnType
      /**
       * Navigate to next validation issue
       */
      navigateToNextIssue: () => ReturnType
      /**
       * Navigate to previous validation issue
       */
      navigateToPreviousIssue: () => ReturnType
    }
  }
}

const ValidationHighlightPluginKey = new PluginKey('validationHighlight')

export const ValidationHighlight = Mark.create<ValidationHighlightOptions>({
  name: 'validationHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
      issues: [],
      onIssueClick: undefined,
    }
  },

  addAttributes() {
    return {
      severity: {
        default: 'error',
        parseHTML: element => element.getAttribute('data-severity'),
        renderHTML: attributes => {
          if (!attributes.severity) {
            return {}
          }
          return {
            'data-severity': attributes.severity,
          }
        },
      },
      message: {
        default: '',
        parseHTML: element => element.getAttribute('data-message'),
        renderHTML: attributes => {
          if (!attributes.message) {
            return {}
          }
          return {
            'data-message': attributes.message,
          }
        },
      },
      issueType: {
        default: '',
        parseHTML: element => element.getAttribute('data-issue-type'),
        renderHTML: attributes => {
          if (!attributes.issueType) {
            return {}
          }
          return {
            'data-issue-type': attributes.issueType,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-validation-highlight]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const severity = HTMLAttributes['data-severity'] || 'error'
    const severityClass = `validation-highlight-${severity}`
    
    return [
      'span',
      mergeAttributes(
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          'data-validation-highlight': '',
          class: `validation-highlight ${severityClass}`,
          title: HTMLAttributes['data-message'] || '',
        }
      ),
      0,
    ]
  },

  addCommands() {
    return {
      setValidationIssues:
        (issues: ValidationIssue[]) =>
        ({ tr, dispatch, state }) => {
          if (dispatch) {
            const plugin = ValidationHighlightPluginKey.get(state)
            if (plugin) {
              tr.setMeta(ValidationHighlightPluginKey, { type: 'setIssues', issues })
            }
          }
          return true
        },

      clearValidationHighlights:
        () =>
        ({ tr, dispatch, state }) => {
          if (dispatch) {
            tr.setMeta(ValidationHighlightPluginKey, { type: 'clearIssues' })
          }
          return true
        },

      navigateToNextIssue:
        () =>
        ({ tr, dispatch, state, view }) => {
          const plugin = ValidationHighlightPluginKey.get(state)
          if (plugin && dispatch) {
            tr.setMeta(ValidationHighlightPluginKey, { type: 'navigateNext' })
          }
          return true
        },

      navigateToPreviousIssue:
        () =>
        ({ tr, dispatch, state, view }) => {
          const plugin = ValidationHighlightPluginKey.get(state)
          if (plugin && dispatch) {
            tr.setMeta(ValidationHighlightPluginKey, { type: 'navigatePrevious' })
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: ValidationHighlightPluginKey,
        state: {
          init() {
            return {
              issues: extension.options.issues,
              currentIssueIndex: -1,
              decorations: DecorationSet.empty,
            }
          },
          apply(tr, pluginState, oldState, newState) {
            const meta = tr.getMeta(ValidationHighlightPluginKey)
            
            if (meta) {
              switch (meta.type) {
                case 'setIssues':
                  const newIssues = meta.issues || []
                  const decorations = createDecorations(newIssues, newState.doc)
                  return {
                    ...pluginState,
                    issues: newIssues,
                    decorations,
                    currentIssueIndex: newIssues.length > 0 ? 0 : -1,
                  }
                
                case 'clearIssues':
                  return {
                    ...pluginState,
                    issues: [],
                    decorations: DecorationSet.empty,
                    currentIssueIndex: -1,
                  }
                
                case 'navigateNext':
                  if (pluginState.issues.length > 0) {
                    const nextIndex = (pluginState.currentIssueIndex + 1) % pluginState.issues.length
                    return {
                      ...pluginState,
                      currentIssueIndex: nextIndex,
                    }
                  }
                  return pluginState
                
                case 'navigatePrevious':
                  if (pluginState.issues.length > 0) {
                    const prevIndex = pluginState.currentIssueIndex === 0 
                      ? pluginState.issues.length - 1 
                      : pluginState.currentIssueIndex - 1
                    return {
                      ...pluginState,
                      currentIssueIndex: prevIndex,
                    }
                  }
                  return pluginState
              }
            }

            // Update decorations if document changed
            if (tr.docChanged && pluginState.issues.length > 0) {
              const decorations = createDecorations(pluginState.issues, newState.doc)
              return {
                ...pluginState,
                decorations,
              }
            }

            return pluginState
          },
        },
        props: {
          decorations(state) {
            const pluginState = ValidationHighlightPluginKey.getState(state)
            return pluginState?.decorations || DecorationSet.empty
          },
          handleClick(view, pos, event) {
            const pluginState = ValidationHighlightPluginKey.getState(view.state)
            if (pluginState?.issues) {
              const clickedIssue = pluginState.issues.find((issue: ValidationIssue) => 
                pos >= issue.position.start && pos <= issue.position.end
              )
              if (clickedIssue && extension.options.onIssueClick) {
                extension.options.onIssueClick(clickedIssue)
                return true
              }
            }
            return false
          },
        },
      }),
    ]
  },

  addGlobalAttributes() {
    return [
      {
        types: [this.name],
        attributes: {
          class: {
            default: null,
            renderHTML: attributes => {
              return {
                class: attributes.class,
              }
            },
          },
        },
      },
    ]
  },
})

function createDecorations(issues: ValidationIssue[], doc: any): DecorationSet {
  const decorations: Decoration[] = []

  issues.forEach((issue: ValidationIssue, index: number) => {
    const { start, end } = issue.position
    
    // Ensure positions are within document bounds
    const docSize = doc.content.size
    const safeStart = Math.max(0, Math.min(start, docSize))
    const safeEnd = Math.max(safeStart, Math.min(end, docSize))

    if (safeStart < safeEnd) {
      const decoration = Decoration.inline(safeStart, safeEnd, {
        class: `validation-highlight validation-highlight-${issue.severity}`,
        'data-severity': issue.severity,
        'data-message': issue.message,
        'data-issue-type': issue.type,
        'data-issue-index': index.toString(),
      })
      decorations.push(decoration)
    }
  })

  return DecorationSet.create(doc, decorations)
}

export default ValidationHighlight 