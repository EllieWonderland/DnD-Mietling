import { spawnSync } from 'node:child_process'
import { mkdirSync, statSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

// Local preview: an AI still with periodic procedural fog, not generative video.
// Requires ffmpeg on PATH; preserves the camera and all scene geometry.
const [inputArg, outputArg] = process.argv.slice(2)
if (!inputArg || !outputArg) {
  console.error('Usage: node scripts/render-ambient-fog.mjs <image> <output.mp4>')
  process.exit(1)
}

const input = resolve(inputArg)
const output = resolve(outputArg)
if (!existsSync(input) || !statSync(input).isFile()) {
  console.error(`Input image not found: ${input}`)
  process.exit(1)
}
if (existsSync(output)) {
  console.error(`Output already exists; choose a new filename: ${output}`)
  process.exit(1)
}
mkdirSync(dirname(output), { recursive: true })

// Every temporal term has a period of exactly 12 seconds. Rendering 288
// frames at 24 fps omits the duplicate endpoint and gives a continuous wrap.
const fog = '16+20*(0.5+0.5*sin(2*PI*X/W+2*PI*T/12+0.7*sin(2*PI*Y/H)))'
  + '*(0.5+0.5*cos(2*PI*Y/H-2*PI*T/12))*exp(-pow((Y/H-0.62)/0.23,2))'
const filter = [
  '[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,format=yuv420p[base]',
  `[1:v]geq=lum='${fog}':cb=128:cr=128,scale=1920:1080:flags=bilinear,format=yuv420p[fog]`,
  "[base][fog]blend=c0_expr='min(235,A+B-16)':c1_expr=A:c2_expr=A:shortest=1,format=yuv420p[v]",
].join(';')

const result = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'warning', '-n',
  '-loop', '1', '-framerate', '24', '-i', input,
  '-f', 'lavfi', '-i', 'color=c=black:s=480x270:r=24:d=12',
  '-filter_complex', filter, '-map', '[v]', '-frames:v', '288', '-an',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
  '-profile:v', 'high', '-level:v', '4.1', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', output,
], { stdio: 'inherit' })

if (result.error) console.error(result.error.message)
process.exit(result.status ?? 1)
