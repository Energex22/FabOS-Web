import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { authHeaders } from './auth.js'

export default function CadPreview({ artifact }) {
  const mountRef = useRef(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!artifact?.url || artifact.format !== 'stl' || !mountRef.current) return undefined
    let disposed = false
    const mount = mountRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf4f8e4)
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    mount.replaceChildren(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    scene.add(new THREE.HemisphereLight(0xffffff, 0x445544, 2.2))
    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    key.position.set(2, 3, 4)
    scene.add(key)
    const loader = new STLLoader()
    let mesh
    let frame
    const resize = () => {
      const width = mount.clientWidth || 320
      const height = Math.max(260, mount.clientHeight || 320)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    const fit = object => {
      const box = new THREE.Box3().setFromObject(object)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxSize = Math.max(size.x, size.y, size.z)
      camera.position.set(maxSize * 1.7, maxSize * 1.4, maxSize * 1.7)
      camera.near = Math.max(maxSize / 1000, 0.01)
      camera.far = Math.max(maxSize * 100, 1000)
      camera.lookAt(center)
      controls.target.copy(center)
      controls.update()
    }
    fetch(artifact.url, { headers: { ...authHeaders() } })
      .then(response => {
        if (!response.ok) throw new Error('The preview could not be loaded.')
        return response.arrayBuffer()
      })
      .then(buffer => {
        if (disposed) return
        const geometry = loader.parse(buffer)
        geometry.computeVertexNormals()
        mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x38a169, metalness: 0.12, roughness: 0.62 }))
        scene.add(mesh)
        fit(mesh)
        resize()
      })
      .catch(err => { if (!disposed) setError(err.message || 'The preview could not be loaded.') })
    const onResize = () => resize()
    window.addEventListener('resize', onResize)
    const animate = () => {
      if (disposed) return
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()
    resize()
    return () => {
      disposed = true
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(frame)
      controls.dispose()
      if (mesh) {
        mesh.geometry.dispose()
        mesh.material.dispose()
      }
      renderer.dispose()
      mount.replaceChildren()
    }
  }, [artifact?.url, artifact?.format])
  if (!artifact || artifact.format !== 'stl') return null
  return <div className="cw-cad-preview"><div ref={mountRef} className="cw-cad-preview-canvas" />{error && <small className="cw-error">{error}</small>}<span>Drag to orbit · Scroll to zoom</span></div>
}
