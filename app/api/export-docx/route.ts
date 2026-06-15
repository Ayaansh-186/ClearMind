import { NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, TableOfContents
} from 'docx'

// Parse markdown into docx elements
function parseMarkdown(markdown: string) {
  const lines = markdown.split('\n')
  const children: any[] = []

  const bulletConfig = {
    reference: 'bullets',
    levels: [{
      level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } }
    }, {
      level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 1080, hanging: 360 } } }
    }]
  }

  const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
  const cellBorders = { top: border, bottom: border, left: border, right: border }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Skip separator lines between chunks
    if (line.trim() === '---') { i++; continue }

    // H1
    if (line.startsWith('# ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: line.slice(2).trim(), bold: true, size: 36, font: 'Arial' })]
      }))
      i++; continue
    }

    // H2
    if (line.startsWith('## ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: line.slice(3).trim(), bold: true, size: 28, font: 'Arial' })]
      }))
      i++; continue
    }

    // H3
    if (line.startsWith('### ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun({ text: line.slice(4).trim(), bold: true, size: 24, font: 'Arial' })]
      }))
      i++; continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      children.push(new Paragraph({
        indent: { left: 720 },
        border: { left: { style: BorderStyle.SINGLE, size: 4, color: '999999' } },
        children: parseInline(line.slice(2).trim())
      }))
      i++; continue
    }

    // Table — collect all table rows
    if (line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!lines[i].includes('---')) tableLines.push(lines[i])
        i++
      }
      if (tableLines.length > 0) {
        const rows = tableLines.map((tl, rowIdx) => {
          const cells = tl.split('|').filter(c => c.trim()).map(c => c.trim())
          const colWidth = Math.floor(9360 / Math.max(cells.length, 1))
          return new TableRow({
            children: cells.map(cell => new TableCell({
              borders: cellBorders,
              width: { size: colWidth, type: WidthType.DXA },
              shading: rowIdx === 0 ? { fill: 'F0F0F0', type: ShadingType.CLEAR } : undefined,
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: parseInline(cell) })]
            }))
          })
        })
        const colCount = tableLines[0].split('|').filter(c => c.trim()).length
        const colWidth = Math.floor(9360 / Math.max(colCount, 1))
        children.push(new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: Array(colCount).fill(colWidth),
          rows
        }))
      }
      continue
    }

    // Bullet points
    if (line.match(/^[\s]*[-*•]\s/)) {
      const indent = line.match(/^(\s*)/)?.[1].length ?? 0
      const level = indent >= 4 ? 1 : 0
      const text = line.replace(/^[\s]*[-*•]\s/, '').trim()
      children.push(new Paragraph({
        numbering: { reference: 'bullets', level },
        children: parseInline(text)
      }))
      i++; continue
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const text = line.replace(/^\d+\.\s/, '').trim()
      children.push(new Paragraph({
        numbering: { reference: 'numbers', level: 0 },
        children: parseInline(text)
      }))
      i++; continue
    }

    // Empty line
    if (line.trim() === '') {
      children.push(new Paragraph({ children: [new TextRun('')] }))
      i++; continue
    }

    // Regular paragraph
    children.push(new Paragraph({ children: parseInline(line.trim()) }))
    i++
  }

  return { children, bulletConfig }
}

function parseInline(text: string): TextRun[] {
  const runs: TextRun[] = []
  // Handle **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  for (const part of parts) {
    if (!part) continue
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({ text: part.slice(2, -2), bold: true, font: 'Arial', size: 22 }))
    } else if (part.startsWith('*') && part.endsWith('*')) {
      runs.push(new TextRun({ text: part.slice(1, -1), italics: true, font: 'Arial', size: 22 }))
    } else if (part.startsWith('`') && part.endsWith('`')) {
      runs.push(new TextRun({ text: part.slice(1, -1), font: 'Courier New', size: 20, shading: { fill: 'F0F0F0', type: ShadingType.CLEAR } }))
    } else {
      runs.push(new TextRun({ text: part, font: 'Arial', size: 22 }))
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text, font: 'Arial', size: 22 })]
}

export async function POST(request: Request) {
  const { markdown, title } = await request.json()
  if (!markdown) return NextResponse.json({ error: 'No content' }, { status: 400 })

  try {
    const { children, bulletConfig } = parseMarkdown(markdown)

    const doc = new Document({
      numbering: {
        config: [
          bulletConfig,
          {
            reference: 'numbers',
            levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } } }]
          }
        ]
      },
      styles: {
        default: { document: { run: { font: 'Arial', size: 22 } } },
        paragraphStyles: [
          { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 36, bold: true, font: 'Arial', color: '1a1a1a' },
            paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0,
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'CCCCCC' } } } },
          { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 28, bold: true, font: 'Arial', color: '1a1a1a' },
            paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
          { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
            run: { size: 24, bold: true, font: 'Arial', color: '333333' },
            paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } },
        ]
      },
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        children
      }]
    })

    const buffer = await Packer.toBuffer(doc)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${(title || 'notes').replace(/[^a-z0-9]/gi, '_')}.docx"`,
      }
    })
  } catch (err) {
    console.error('DOCX FAILED:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
