import cannon from 'cannon'
import '@babylonjs/loaders/glTF'
import '@babylonjs/inspector'
import App from './App'
window.CANNON = cannon
new App()
