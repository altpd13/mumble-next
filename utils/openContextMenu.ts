function openContextMenu(event: any, contextMenu: any, target: any) {
  contextMenu.posX = event.clientX
  contextMenu.posY = event.clientY
  contextMenu.target = target

  const closeListener = () => {
    // Always close, no matter where they clicked
    setTimeout(() => { // delay to allow click to be actually processed
      contextMenu.target = null
      unregister()
    })
  }
  const unregister = () => document.removeEventListener('click', closeListener)
  document.addEventListener('click', closeListener)

  event.stopPropagation()
  event.preventDefault()
}

export default openContextMenu