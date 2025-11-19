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

  // UX - Elementos para exibir valores em tempo real (Garantir que existam no HTML)
  const zoomValueSpan = document.getElementById("zoomValue")
  const xValueSpan = document.getElementById("xValue")
  const yValueSpan = document.getElementById("yValue")

  // --- CONSTANTES E CONFIGURAÇÃO DE TAMANHO ---
  const CELL_SIZE = 600
  const BORDER_SIZE_CSS = 12 // A borda de 12px que você quer imitar no CSS
  const COLS = 3
  const ROWS = 3
  const MAX_IMAGES = 9 // Total de células criadas (2 colunas x 3 linhas)

  const CELL_SIZE_CSS = 500
  const SIZE_ADJUST = CELL_SIZE / CELL_SIZE_CSS
  const BORDER_DRAW_SIZE = BORDER_SIZE_CSS * SIZE_ADJUST // Espessura da borda no Canvas (~14.4px)

  // NOVO: Define o espaçamento entre as células e a margem externa
  const SEPARATION_SIZE = 5

  // Largura total de uma célula, incluindo suas duas bordas (esquerda e direita)
  const CELL_WITH_BORDERS_SIZE = CELL_SIZE + 2 * BORDER_DRAW_SIZE

  // CALCULO FINAL CORRIGIDO: Total = Células * (Tamanho da Célula com Bordas) + (Número de Células + 1) * SEPARATION_SIZE
  const FINAL_WIDTH =
    COLS * CELL_WITH_BORDERS_SIZE + (COLS + 1) * SEPARATION_SIZE
  const FINAL_HEIGHT =
    ROWS * CELL_WITH_BORDERS_SIZE + (ROWS + 1) * SEPARATION_SIZE

  canvasOutput.width = FINAL_WIDTH
  canvasOutput.height = FINAL_HEIGHT
  // --- FIM CONSTANTES ---

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
          // SUGERIDO: Lógica de centralização da imagem aqui (se implementado)
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
      // Atualiza os inputs
      zoomControl.value = scale.toFixed(2)
      xControl.value = Math.round(offsetX)
      yControl.value = Math.round(offsetY)

      // UX: Atualiza os spans de valor
      zoomValueSpan.textContent = scale.toFixed(2)
      xValueSpan.textContent = Math.round(offsetX)
      yValueSpan.textContent = Math.round(offsetY)
    }

    function setControls() {
      // UX: Remove a classe de seleção da célula anterior
      if (selectedCell && selectedCell.canvas) {
        selectedCell.canvas.parentElement.classList.remove("selected")
      }

      selectedCell = cellData

      // UX: Adiciona a classe de seleção à célula atual
      cell.classList.add("selected")

      controlPanel.classList.remove("hidden")
      updateControls()
    }

    zoomControl.addEventListener("input", () => {
      if (selectedCell !== cellData) return
      scale = parseFloat(zoomControl.value)
      draw()
      zoomValueSpan.textContent = scale.toFixed(2) // UX: atualização em tempo real
    })

    xControl.addEventListener("input", () => {
      if (selectedCell !== cellData) return
      offsetX = parseInt(xControl.value)
      draw()
      xValueSpan.textContent = offsetX // UX: atualização em tempo real
    })

    yControl.addEventListener("input", () => {
      if (selectedCell !== cellData) return
      offsetY = parseInt(yControl.value)
      draw()
      yValueSpan.textContent = offsetY // UX: atualização em tempo real
    })

    // CORREÇÃO: Clique simples abre apenas o painel de ajuste
    cell.addEventListener("click", () => {
      setControls()
    })

    // CORREÇÃO: Duplo clique abre o diálogo de seleção de arquivo
    cell.addEventListener("dblclick", () => {
      input.click()
      // setControls() // O setControls será chamado no click simples subsequente
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
      // UX: Remove o destaque da célula selecionada ao fechar o painel
      if (selectedCell) {
        selectedCell.canvas.parentElement.classList.remove("selected")
      }
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
    // 1. LIMPEZA TOTAL E BORDA EXTERNA GRADIENTE
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, FINAL_WIDTH, FINAL_HEIGHT)

    // Esperar imagens carregarem
    for (const cell of cells) {
      await waitImageLoad(cell.img)
    }

    // Desenha o quadro gradiente total (CORREÇÃO DE BORDA EXTERNA)
    const externalGrad = ctx.createLinearGradient(
      0,
      FINAL_HEIGHT,
      FINAL_WIDTH,
      0
    )
    externalGrad.addColorStop(0, "#ff0055")
    externalGrad.addColorStop(1, "#1e723a")

    // Preenche todo o Canvas com o gradiente
    ctx.fillStyle = externalGrad
    ctx.fillRect(0, 0, FINAL_WIDTH, FINAL_HEIGHT)

    // Desenha a MÁSCARA BRANCA INTERNA (cria a margem externa)
    const innerCanvasWidth = FINAL_WIDTH - 2 * SEPARATION_SIZE
    const innerCanvasHeight = FINAL_HEIGHT - 2 * SEPARATION_SIZE

    ctx.fillStyle = "#fff"
    ctx.fillRect(
      SEPARATION_SIZE,
      SEPARATION_SIZE,
      innerCanvasWidth,
      innerCanvasHeight
    )

    // 2. Desenhar as BORDAS INTERNAS e o fundo branco para cada célula
    for (let i = 0; i < MAX_IMAGES; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)

      // Posição de início do retângulo gradiente (após a separação externa)
      const cellStartX =
        SEPARATION_SIZE + col * (CELL_WITH_BORDERS_SIZE + SEPARATION_SIZE)
      const cellStartY =
        SEPARATION_SIZE + row * (CELL_WITH_BORDERS_SIZE + SEPARATION_SIZE)

      // Criar e aplicar o Gradiente INTERNO
      const grad = ctx.createLinearGradient(
        cellStartX,
        cellStartY + CELL_WITH_BORDERS_SIZE,
        cellStartX + CELL_WITH_BORDERS_SIZE,
        cellStartY
      )
      grad.addColorStop(0, "#ff0055")
      grad.addColorStop(1, "#1e723a")

      // Desenhar o retângulo gradiente (BORDA + INTERIOR)
      ctx.fillStyle = grad
      ctx.fillRect(
        cellStartX,
        cellStartY,
        CELL_WITH_BORDERS_SIZE,
        CELL_WITH_BORDERS_SIZE
      )

      // Desenhar o retângulo branco por cima (A MÁSCARA INTERNA)
      ctx.fillStyle = "#fff"
      ctx.fillRect(
        cellStartX + BORDER_DRAW_SIZE,
        cellStartY + BORDER_DRAW_SIZE,
        CELL_SIZE,
        CELL_SIZE
      )
    }

    // 3. Desenhar o conteúdo da imagem (o que estava faltando)
    cells.forEach((cell, index) => {
      if (!cell.img || !cell.img.src || !cell.img.complete) return

      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = CELL_SIZE
      tempCanvas.height = CELL_SIZE
      const tempCtx = tempCanvas.getContext("2d")

      const iw = cell.img.width * cell.scale
      const ih = cell.img.height * cell.scale
      tempCtx.drawImage(cell.img, cell.offsetX, cell.offsetY, iw, ih)

      const col = index % COLS
      const row = Math.floor(index / COLS)

      // POSIÇÃO DE DESENHO DA IMAGEM: Mesma posição da MÁSCARA BRANCA INTERNA
      const posX =
        SEPARATION_SIZE +
        col * (CELL_WITH_BORDERS_SIZE + SEPARATION_SIZE) +
        BORDER_DRAW_SIZE
      const posY =
        SEPARATION_SIZE +
        row * (CELL_WITH_BORDERS_SIZE + SEPARATION_SIZE) +
        BORDER_DRAW_SIZE

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
