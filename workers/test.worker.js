self.addEventListener('message', (event) => console.log('Worker received:', event.data))
self.postMessage('Fuck you Main Thread')

onmessage = e => {
  console.log(e.data)
}
