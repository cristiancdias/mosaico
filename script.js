;(() => {
  const grid = document.getElementById("grid")
  const canvasOutput = document.getElementById("finalCanvas")
  const ctx = canvasOutput.getContext("2d")
  const generateBtn = document.getElementById("generate")

  const zoomControl = document.getElementById("zoomControl")
  const xControl = document.getElementById("xControl")
  const yControl = document.getElementById("yControl")
  const controlPanel = document.getElementById("controls")
  const dragHandle = document.getElementById("dragHandle")

  const CELL_SIZE = 500
  const BORDER_SIZE_CSS = 12
  const COLS = 3
  const ROWS = 3
  const MAX_IMAGES = 9

  const CELL_SIZE_CSS = 500
  const SIZE_ADJUST = CELL_SIZE / CELL_SIZE_CSS
  const BORDER_DRAW_SIZE = BORDER_SIZE_CSS * SIZE_ADJUST

  const FINAL_WIDTH = COLS * CELL_SIZE + (COLS + 1) * BORDER_DRAW_SIZE
  const FINAL_HEIGHT = ROWS * CELL_SIZE + (ROWS + 1) * BORDER_DRAW_SIZE
  canvasOutput.width = FINAL_WIDTH
  canvasOutput.height = FINAL_HEIGHT

  let cells = []
  let selectedCell = null

  function createCell(index) {
    const cell = document.createElement("div")
    cell.className = "grid-cell"

    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"

    const canvas = document.createElement("canvas")
    canvas.width = CELL_SIZE
    canvas.height = CELL_SIZE
    const ctxCell = canvas.getContext("2d")

    let img = null
    let scale = 1
    let offsetX = 0
    let offsetY = 0
    let isDragging = false
    let dragStartX = 0
    let dragStartY = 0

    input.addEventListener("change", e => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = evt => {
        img = new Image()
        img.onload = () => {
          scale = 1
          offsetX = 0
          offsetY = 0
          draw()
          if (selectedCell === cellData) updateControls()
        }
        img.src = evt.target.result
      }
      reader.readAsDataURL(file)
    })

    function draw() {
      ctxCell.clearRect(0, 0, CELL_SIZE, CELL_SIZE)
      if (!img || !img.complete) return
      const iw = img.width * scale
      const ih = img.height * scale
      ctxCell.drawImage(img, offsetX, offsetY, iw, ih)
    }

    canvas.addEventListener("mousedown", e => {
      if (selectedCell !== cellData) return
      isDragging = true
      dragStartX = e.offsetX
      dragStartY = e.offsetY
    })

    canvas.addEventListener("mousemove", e => {
      if (!isDragging) return
      const dx = e.offsetX - dragStartX
      const dy = e.offsetY - dragStartY
      offsetX += dx
      offsetY += dy
      dragStartX = e.offsetX
      dragStartY = e.offsetY
      draw()
      updateControls()
    })

    canvas.addEventListener("mouseup", () => {
      isDragging = false
    })

    canvas.addEventListener("mouseleave", () => {
      isDragging = false
    })

    function updateControls() {
      zoomControl.value = scale.toFixed(2)
      xControl.value = Math.round(offsetX)
      yControl.value = Math.round(offsetY)
    }

    function setControls() {
      selectedCell = cellData
      controlPanel.classList.remove("hidden")
      updateControls()
    }

    zoomControl.addEventListener("input", () => {
      if (selectedCell !== cellData) return
      scale = parseFloat(zoomControl.value)
      draw()
    })

    xControl.addEventListener("input", () => {
      if (selectedCell !== cellData) return
      offsetX = parseInt(xControl.value)
      draw()
    })

    yControl.addEventListener("input", () => {
      if (selectedCell !== cellData) return
      offsetY = parseInt(yControl.value)
      draw()
    })

    cell.addEventListener("click", () => {
      setControls()
    })

    cell.addEventListener("dblclick", () => {
      input.click()
    })

    cell.appendChild(canvas)
    cell.appendChild(input)

    const cellData = {
      canvas,
      ctxCell,
      get img() {
        return img
      },
      set img(value) {
        img = value
      },
      get scale() {
        return scale
      },
      set scale(val) {
        scale = val
      },
      get offsetX() {
        return offsetX
      },
      set offsetX(val) {
        offsetX = val
      },
      get offsetY() {
        return offsetY
      },
      set offsetY(val) {
        offsetY = val
      },
      draw,
      setControls
    }

    return cellData
  }

  for (let i = 0; i < MAX_IMAGES; i++) {
    const cellData = createCell(i)
    cells.push(cellData)
    grid.appendChild(cellData.canvas.parentElement)
  }

  document.body.addEventListener("click", e => {
    if (!controlPanel.contains(e.target) && !grid.contains(e.target)) {
      controlPanel.classList.add("hidden")
      selectedCell = null
    }
  })

  function waitImageLoad(image) {
    return new Promise(resolve => {
      if (!image) resolve()
      else if (image.complete) resolve()
      else image.onload = () => resolve()
    })
  }

  generateBtn.addEventListener("click", async () => {
    // 1. Configurações e limpeza do canvas
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, FINAL_WIDTH, FINAL_HEIGHT)

    // Esperar imagens carregarem
    for (const cell of cells) {
      await waitImageLoad(cell.img)
    }

    const CELL_SIZE_CSS = 500
    const BORDER_SIZE_CSS = 12 // 12px de borda gradiente no CSS

    // Ajusta o tamanho da borda para a proporção do canvas (600px)
    const SIZE_ADJUST = CELL_SIZE / CELL_SIZE_CSS
    // O tamanho que a borda deve ter no finalCanvas (12 * 1.2 = 14.4px)
    const BORDER_DRAW_SIZE = BORDER_SIZE_CSS * SIZE_ADJUST

    // 2. Desenhar primeiro a Borda Gradiente e o fundo branco para cada célula
    for (let i = 0; i < MAX_IMAGES; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)

      // Posição do canto superior esquerdo da área da CÉLULA + BORDA
      const cellFullX = BORDER_DRAW_SIZE + col * (CELL_SIZE + BORDER_DRAW_SIZE)
      const cellFullY = BORDER_DRAW_SIZE + row * (CELL_SIZE + BORDER_DRAW_SIZE)

      // Criar o Gradiente Linear Diagonal (do canto inf-esq para sup-dir)
      const grad = ctx.createLinearGradient(
        cellFullX - BORDER_DRAW_SIZE,
        cellFullY + CELL_SIZE + BORDER_DRAW_SIZE,
        cellFullX + CELL_SIZE + BORDER_DRAW_SIZE,
        cellFullY - BORDER_DRAW_SIZE
      )

      // Cores: #ff0055 -> #1e723a
      grad.addColorStop(0, "#ff0055")
      grad.addColorStop(1, "#1e723a")

      // Desenhar o retângulo gradiente que cobre a borda e o interior
      ctx.fillStyle = grad
      ctx.fillRect(
        cellFullX - BORDER_DRAW_SIZE,
        cellFullY - BORDER_DRAW_SIZE,
        CELL_SIZE + 2 * BORDER_DRAW_SIZE,
        CELL_SIZE + 2 * BORDER_DRAW_SIZE
      )

      // Desenhar o retângulo branco por cima, "cortando" o gradiente,
      // deixando apenas a área da borda visível.
      ctx.fillStyle = "#fff"
      ctx.fillRect(cellFullX, cellFullY, CELL_SIZE, CELL_SIZE)
    }

    // 3. Desenhar o conteúdo da imagem (o que estava faltando)
    cells.forEach((cell, index) => {
      if (!cell.img || !cell.img.src || !cell.img.complete) return

      // Cria um canvas temporário para desenhar a imagem ajustada (zoom/offset)
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = CELL_SIZE
      tempCanvas.height = CELL_SIZE
      const tempCtx = tempCanvas.getContext("2d")

      const iw = cell.img.width * cell.scale
      const ih = cell.img.height * cell.scale
      tempCtx.drawImage(cell.img, cell.offsetX, cell.offsetY, iw, ih)

      const col = index % COLS
      const row = Math.floor(index / COLS)

      // A POSIÇÃO FINAL AGORA É O CANTO SUPERIOR ESQUERDO DO QUADRADO INTERNO BRANCO.
      const posX = BORDER_DRAW_SIZE + col * (CELL_SIZE + BORDER_DRAW_SIZE)
      const posY = BORDER_DRAW_SIZE + row * (CELL_SIZE + BORDER_DRAW_SIZE)

      // Desenha a imagem na posição correta, DENTRO da borda.
      ctx.drawImage(tempCanvas, posX, posY)
    })

    // Baixar o JPG final
    canvasOutput.toBlob(
      blob => {
        const link = document.createElement("a")
        link.download = "mosaico.jpg"
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
      },
      "image/jpeg",
      1
    )
  })

  // Drag do painel só pela barra azul (dragHandle)
  let drag = false
  let offsetXdrag = 0
  let offsetYdrag = 0

  dragHandle.addEventListener("mousedown", e => {
    drag = true
    offsetXdrag = e.clientX - controlPanel.offsetLeft
    offsetYdrag = e.clientY - controlPanel.offsetTop
    dragHandle.style.cursor = "grabbing"
  })

  document.addEventListener("mouseup", () => {
    drag = false
    dragHandle.style.cursor = "grab"
  })

  document.addEventListener("mousemove", e => {
    if (!drag) return
    e.preventDefault()
    let left = e.clientX - offsetXdrag
    let top = e.clientY - offsetYdrag
    left = Math.max(
      0,
      Math.min(window.innerWidth - controlPanel.offsetWidth, left)
    )
    top = Math.max(
      0,
      Math.min(window.innerHeight - controlPanel.offsetHeight, top)
    )
    controlPanel.style.left = left + "px"
    controlPanel.style.top = top + "px"
  })
})()
