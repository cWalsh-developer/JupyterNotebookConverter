-- Lua filter to handle notebook cell outputs
-- Removes gray background from output cells while keeping it for code input cells
-- Converts parameter/configuration tables to code blocks

-- Helper function to count table rows
local function count_table_rows(tbl)
  local count = 0
  if tbl.head and tbl.head.rows then
    count = count + #tbl.head.rows
  end
  for _, tbody in ipairs(tbl.bodies) do
    count = count + #tbody.body
  end
  return count
end

-- Helper function to count table columns
local function count_table_cols(tbl)
  if tbl.head and tbl.head.rows and #tbl.head.rows > 0 then
    return #tbl.head.rows[1].cells
  end
  if #tbl.bodies > 0 and #tbl.bodies[1].body > 0 then
    return #tbl.bodies[1].body[1].cells
  end
  return 0
end

-- Helper function to check if table looks like a parameter/config table
local function is_parameter_table(tbl)
  local rows = count_table_rows(tbl)
  local cols = count_table_cols(tbl)
  
  -- Any 2-column table is likely a parameter table (be aggressive)
  if cols == 2 then
    return true
  end
  
  -- 3-column tables with less than 20 rows could also be parameter tables
  if cols == 3 and rows < 20 then
    return true
  end
  
  -- Very small tables are likely config output
  if rows <= 5 and cols <= 4 then
    return true
  end
  
  return false
end

-- Helper function to convert table to code block text
local function table_to_code_block(tbl)
  local lines = {}
  
  -- Process all rows
  local function process_rows(rows)
    for _, row in ipairs(rows) do
      local cells = {}
      for _, cell in ipairs(row.cells) do
        local content = pandoc.utils.stringify(cell.contents)
        table.insert(cells, content)
      end
      table.insert(lines, table.concat(cells, "\t"))
    end
  end
  
  if tbl.head and tbl.head.rows then
    process_rows(tbl.head.rows)
  end
  
  for _, tbody in ipairs(tbl.bodies) do
    process_rows(tbody.body)
  end
  
  return pandoc.CodeBlock(table.concat(lines, "\n"))
end

function Div(el)
  -- Check if this is a cell output div
  if el.classes:includes('cell-output') or 
     el.classes:includes('cell-output-stdout') or
     el.classes:includes('cell-output-stderr') or
     el.classes:includes('cell-output-display') or
     el.classes:includes('cell-output-error') then
    
    -- Walk through the div and process its content
    return pandoc.walk_block(el, {
      CodeBlock = function(cb)
        -- Convert output code blocks to plain paragraphs with monospace styling
        local lines = {}
        for line in cb.text:gmatch("[^\r\n]+") do
          table.insert(lines, pandoc.Para({pandoc.Str(line)}))
        end
        
        local div = pandoc.Div(lines)
        div.attributes['custom-style'] = 'Compact'
        return div
      end,
      Table = function(tbl)
        -- Check if this looks like a parameter/configuration table
        if is_parameter_table(tbl) then
          -- Convert to gray code block
          return table_to_code_block(tbl)
        end
        
        -- Otherwise, clean styling and keep as table
        tbl.attr = pandoc.Attr("", {}, {})
        
        if tbl.head then
          for _, row in ipairs(tbl.head.rows) do
            row.attr = pandoc.Attr("", {}, {})
            for _, cell in ipairs(row.cells) do
              cell.attr = pandoc.Attr("", {}, {})
            end
          end
        end
        
        for _, tbody in ipairs(tbl.bodies) do
          for _, row in ipairs(tbody.body) do
            row.attr = pandoc.Attr("", {}, {})
            for _, cell in ipairs(row.cells) do
              cell.attr = pandoc.Attr("", {}, {})
            end
          end
        end
        
        if tbl.foot then
          for _, row in ipairs(tbl.foot.rows) do
            row.attr = pandoc.Attr("", {}, {})
            for _, cell in ipairs(row.cells) do
              cell.attr = pandoc.Attr("", {}, {})
            end
          end
        end
        
        return tbl
      end
    })
  end
  
  return el
end

-- Additional filter to clean up any styled tables throughout the document  
function Table(el)
  -- Strip all styling attributes from tables
  el.attr = pandoc.Attr("", {}, {})
  
  if el.head then
    for _, row in ipairs(el.head.rows) do
      row.attr = pandoc.Attr("", {}, {})
      for _, cell in ipairs(row.cells) do
        cell.attr = pandoc.Attr("", {}, {})
      end
    end
  end
  
  for _, tbody in ipairs(el.bodies) do
    for _, row in ipairs(tbody.body) do
      row.attr = pandoc.Attr("", {}, {})
      for _, cell in ipairs(row.cells) do
        cell.attr = pandoc.Attr("", {}, {})
      end
    end
  end
  
  if el.foot then
    for _, row in ipairs(el.foot.rows) do
      row.attr = pandoc.Attr("", {}, {})
      for _, cell in ipairs(row.cells) do
        cell.attr = pandoc.Attr("", {}, {})
      end
    end
  end
  
  return el
end
