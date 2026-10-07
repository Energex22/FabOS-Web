import React, { useEffect, useRef, useState } from 'react'
import { authHeaders } from './auth.js'
import { cadArtifactUrl } from './api.js'

const vertexSource = `
attribute vec3 a_position;
attribute vec3 a_normal;
uniform mat4 u_projection;
uniform mat4 u_model;
varying float v_light;
void main() {
  vec3 n = normalize((u_model * vec4(a_normal, 0.0)).xyz);
  v_light = 0.35 + 0.65 * max(dot(n, normalize(vec3(0.4, 0.7, 1.0))), 0.0);
  gl_Position = u_projection * u_model * vec4(a_position, 1.0);
}`
const fragmentSource = `
precision mediump float;
varying float v_light;
void main() { gl_FragColor = vec4(0.22 * v_light, 0.63 * v_light, 0.41 * v_light, 1.0); }`

function shader(gl,type,source){
  const s=gl.createShader(type); gl.shaderSource(s,source); gl.compileShader(s)
  if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)||'Shader compilation failed')
  return s
}
function program(gl){
  const p=gl.createProgram(); gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vertexSource)); gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fragmentSource)); gl.linkProgram(p)
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)||'WebGL program failed')
  return p
}
function parseBinaryStl(buffer){
  const view=new DataView(buffer)
  if(view.byteLength<84) throw new Error('Invalid STL preview data.')
  const count=view.getUint32(80,true), stride=50
  if(84+count*stride>view.byteLength) throw new Error('Invalid STL triangle data.')
  const positions=[], normals=[], min=[Infinity,Infinity,Infinity], max=[-Infinity,-Infinity,-Infinity]
  for(let i=0;i<count;i++){
    const base=84+i*stride
    const n=[view.getFloat32(base,true),view.getFloat32(base+4,true),view.getFloat32(base+8,true)]
    for(let v=0;v<3;v++){
      const o=base+12+v*12, p=[view.getFloat32(o,true),view.getFloat32(o+4,true),view.getFloat32(o+8,true)]
      positions.push(...p); normals.push(...n)
      for(let a=0;a<3;a++){min[a]=Math.min(min[a],p[a]);max[a]=Math.max(max[a],p[a])}
    }
  }
  return {positions,normals,min,max,count}
}
function mat4(angleX,angleY,distance,aspect,scale,center){
  const sx=Math.sin(angleX),cx=Math.cos(angleX),sy=Math.sin(angleY),cy=Math.cos(angleY)
  const f=1/Math.tan(Math.PI/8), z=distance
  const p=new Float32Array(16)
  p[0]=f/aspect;p[5]=f;p[10]=(z+0.1)/(0.1-z);p[11]=-1;p[14]=(2*z*0.1)/(0.1-z)
  const m=new Float32Array(16)
  m[0]=cy*scale;m[1]=sx*sy*scale;m[2]=cx*sy*scale
  m[4]=0;m[5]=cx*scale;m[6]=-sx*scale
  m[8]=-sy*scale;m[9]=sx*cy*scale;m[10]=cx*cy*scale
  m[12]=-(m[0]*center[0]+m[4]*center[1]+m[8]*center[2])
  m[13]=-(m[1]*center[0]+m[5]*center[1]+m[9]*center[2])
  m[14]=-z-(m[2]*center[0]+m[6]*center[1]+m[10]*center[2]);m[15]=1
  const out=new Float32Array(16)
  for(let r=0;r<4;r++)for(let col=0;col<4;col++)out[col*4+r]=p[r]*m[col*4]+p[4+r]*m[col*4+1]+p[8+r]*m[col*4+2]+p[12+r]*m[col*4+3]
  return out
}
export default function CadPreview({artifact}){
  const canvasRef=useRef(null),[error,setError]=useState('')
  useEffect(()=>{
    if(!artifact?.url||artifact.format!=='stl'||!canvasRef.current)return
    let dead=false,raf=0,drag=false,lastX=0,lastY=0,ax=0.45,ay=0.65,zoom=1
    const canvas=canvasRef.current,gl=canvas.getContext('webgl',{antialias:true})
    if(!gl){setError('WebGL is not available on this device.');return}
    let data,prog,posBuf,normBuf
    const resize=()=>{const d=Math.min(window.devicePixelRatio||1,2),w=canvas.clientWidth*d,h=canvas.clientHeight*d;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}gl.viewport(0,0,w,h)}
    const draw=()=>{if(dead||!data)return;resize();gl.clearColor(0.957,0.973,0.894,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.useProgram(prog);const pos=gl.getAttribLocation(prog,'a_position'),norm=gl.getAttribLocation(prog,'a_normal');gl.bindBuffer(gl.ARRAY_BUFFER,posBuf);gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,normBuf);gl.enableVertexAttribArray(norm);gl.vertexAttribPointer(norm,3,gl.FLOAT,false,0,0);const aspect=canvas.width/Math.max(1,canvas.height),span=Math.max(data.max[0]-data.min[0],data.max[1]-data.min[1],data.max[2]-data.min[2])||1;const center=data.min.map((v,i)=>(v+data.max[i])/2);gl.uniformMatrix4fv(gl.getUniformLocation(prog,'u_projection'),false,mat4(ax,ay,span*2.4/zoom,aspect,1,center));gl.uniformMatrix4fv(gl.getUniformLocation(prog,'u_model'),false,new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]));gl.drawArrays(gl.TRIANGLES,0,data.positions.length/3);raf=requestAnimationFrame(draw)}
    const load=async()=>{try{const res=await fetch(cadArtifactUrl(artifact),{headers:{...authHeaders()}});if(!res.ok)throw new Error('The preview could not be loaded.');data=parseBinaryStl(await res.arrayBuffer());prog=program(gl);posBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,posBuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.positions),gl.STATIC_DRAW);normBuf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,normBuf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data.normals),gl.STATIC_DRAW);draw()}catch(e){if(!dead)setError(e.message||'The preview could not be loaded.')}}
    const down=e=>{drag=true;lastX=e.clientX;lastY=e.clientY};const move=e=>{if(!drag)return;ay+=(e.clientX-lastX)*0.01;ax+=(e.clientY-lastY)*0.01;lastX=e.clientX;lastY=e.clientY};const up=()=>{drag=false};const wheel=e=>{e.preventDefault();zoom=Math.max(.35,Math.min(3,zoom*(e.deltaY<0?1.1:.9)))}
    canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);window.addEventListener('pointerup',up);canvas.addEventListener('wheel',wheel,{passive:false});window.addEventListener('resize',resize);load()
    return()=>{dead=true;cancelAnimationFrame(raf);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);canvas.removeEventListener('wheel',wheel);window.removeEventListener('resize',resize)}
  },[artifact?.url,artifact?.format])
  if(!artifact||artifact.format!=='stl')return null
  return <div className="cw-cad-preview"><canvas ref={canvasRef} className="cw-cad-preview-canvas"/>{error&&<small className="cw-error">{error}</small>}<span>Drag to orbit · Scroll to zoom</span></div>
}
