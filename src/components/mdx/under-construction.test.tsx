import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { UnderConstruction } from './under-construction'

describe('UnderConstruction', () => {
  it('renders a compact notice above wrapped content', () => {
    const renderChild = vi.fn(() => <p>Unfinished content</p>)
    const Child = renderChild

    const markup = renderToStaticMarkup(
      <UnderConstruction>
        <Child />
      </UnderConstruction>,
    )

    expect(markup).toContain('This page is currently under construction.')
    expect(markup).toContain('Unfinished content')
    expect(markup).not.toContain('Click to see the progress')
    expect(renderChild).toHaveBeenCalledOnce()
  })

  it('renders only the standalone message when there is no content', () => {
    const markup = renderToStaticMarkup(<UnderConstruction />)

    expect(markup).toContain('Pages under construction')
    expect(markup).not.toContain('Click to see the progress')
  })
})
