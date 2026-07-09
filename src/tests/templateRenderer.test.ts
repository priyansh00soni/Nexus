import { expect, test, describe } from 'vitest' 
import { templateRenderer } from '../utils/templateRenderer.js' 

describe('templateRenderer', () => {

  test('renders a single variable correctly', () => { 
    expect(templateRenderer('Hello {{name}}', { name: 'Atul' })).toBe('Hello Atul') 
  })

  test('renders multiple variables correctly', () => { 
    expect(templateRenderer('Hello {{name}} from {{city}}', { name: 'Atul', city: 'Delhi' })).toBe('Hello Atul from Delhi') 
  })

  test('returns placeholder as-is if the variable is missing', () => { 
    expect(templateRenderer('Hello {{name}} and {{surName}}', { name: 'Atul' })).toBe('Hello Atul and {{surName}}') 
  })

  test('returns original string if data is provided but no placeholders exist', () => { 
    expect(templateRenderer('Hello World', { name: 'Atul' })).toBe('Hello World') 
  })

})
