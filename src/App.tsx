import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import background from './background.png';

function App() {
  const [width, setWidth] = useState<number>(20);
  const [height, setHeight] = useState<number>(20);
  const [size, setSize] = useState<number>(10);
  const [data, setData] = useState<Record<string, string>>({});
  const [color, setColor] = useState<string>('#000000');

  const [dropper, setDropper] = useState(false);
  const [fill, setFill] = useState(false);
  const [symmetric, setSymmetric] = useState(false);

  const [config, setConfig] = useState<{width: number; height: number; size: number}>({
    width: 20,
    height: 20,
    size: 10,
  });

  const wrapper = useRef<HTMLDivElement>(null);

  const [canvas, ctx] = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.style.background = `url(${background})`;
    canvas.style.userSelect = 'none';

    const ctx = canvas.getContext('2d');
    return [canvas, ctx];
  }, []);

  const handleImage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { width, height, size } = config;
    const files = event.currentTarget.files;
    if (!files) return;
    if (!ctx) return;

    const image = new Image();
    image.onload = () => {
      ctx.drawImage(image, 0, 0);

      const result: Record<string, string> = {};

      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          const imageData = ctx.getImageData(
            Math.floor(i * size + size / 2),
            Math.floor(j * size + size / 2),
            1,
            1
          );
          const [r, g, b, a] = Array.from(imageData.data);
          result[`${i}:${j}`] = a === 0 ? 'transparent' : `rgb(${r}, ${g}, ${b})`;
        }

        setData(result);
      }
    };

    image.src = URL.createObjectURL(files[0]);
  }, [config, canvas, ctx]);

  useEffect(() => {
    const { width, height, size } = config;
    const result: Record<string, string> = {};
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        result[`${i}:${j}`] = 'transparent';
      }
    }
    setData(result);
    canvas.style.backgroundSize = `${size}px`;
  }, [config, canvas]);

  const resizeCanvas = () => {
    setConfig({ width, height, size });
  };

  useEffect(() => {
    const { height, width, size } = config;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        ctx.fillStyle = data[`${i}:${j}`];
        ctx.fillRect(i * size, j * size, size, size);
      }
    }
  }, [data, canvas, ctx, config]);

  useEffect(() => {
    const { width, height, size } = config;
    const mousedown = (event: MouseEvent) => {
      const [x, y] = [
        Math.floor(event.offsetX / size),
        Math.floor(event.offsetY / size),
      ];
      if (fill) {
        const frontier = [[x, y]];
        const visited = new Set<string>();
        const result: Record<string, string> = {};
        const colorHere = data[`${x}:${y}`];

        while (frontier.length > 0) {
          const next = frontier.pop();
          if (!next) continue;

          const [nx, ny] = next;
          if (nx >= width || nx < 0 || ny >= width || ny < 0) continue;
          if (visited.has(`${nx}:${ny}`)) continue;
          if (data[`${nx}:${ny}`] !== colorHere) continue;

          visited.add(`${nx}:${ny}`);
          result[`${nx}:${ny}`] = color;

          frontier.push([nx + 1, ny]);
          frontier.push([nx - 1, ny]);
          frontier.push([nx, ny + 1]);
          frontier.push([nx, ny - 1]);
        }

        setData({
          ...data,
          ...result
        });
      } else if (dropper) {
        setColor(data[`${x}:${y}`]);
        setDropper(false);
      } else if (data[`${x}:${y}`] !== color) {
        setData({
          ...data,
          [`${x}:${y}`]: color,
          ...(symmetric ? {
            [`${width - x}:${y}`]: color
          } : {})
        });
      }
    };
    const mousemove = (event: MouseEvent) => {
      if (event.buttons !== 1) return;
      const [x, y] = [
        Math.floor(event.offsetX / size),
        Math.floor(event.offsetY / size),
      ];
      if (fill) {
        return;
      } else if (dropper) {
        return;
      } if (data[`${x}:${y}`] !== color) {
        setData({
          ...data,
          [`${x}:${y}`]: color,
          ...(symmetric ? {
            [`${width - x}:${y}`]: color
          } : {})
        });
      }
    };

    canvas.addEventListener('mousedown', mousedown);
    canvas.addEventListener('mousemove', mousemove);

    return () => {
      canvas.removeEventListener('mousedown', mousedown);
      canvas.removeEventListener('mousemove', mousemove);
    }
  }, [canvas, ctx, color, data, fill, dropper, symmetric, config]);

  useEffect(() => {
    const { width, height, size } = config;
    if (!ctx) return;

    canvas.width = width * size;
    canvas.height = height * size;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [config, canvas, ctx]);

  useEffect(() => {
    if (wrapper.current) wrapper.current.appendChild(canvas);
  }, []);

  return (
    <div className="App">
      <h1>Pixel editor</h1>
      <center>
        <div>
          <input onChange={(event) => setWidth(Number(event.target.value))} placeholder="Width"/>
          <input onChange={(event) => setHeight(Number(event.target.value))} placeholder="Height"/>
          <input onChange={(event) => setSize(Number(event.target.value))} placeholder="Fatbit size"/>
          <button onClick={() => resizeCanvas()}>New</button>
        </div>
        <div>
          Color: <input value={color} type="color" onChange={(event) => setColor(event.target.value)}/> <button onClick={() => setDropper(true)}>Dropper</button> <button onClick={() => setFill(!fill)}>Fill ({fill ? 'on' : 'off'})</button> <button onClick={() => setColor('transparent')}>Erase</button> <button onClick={() => setSymmetric(!symmetric) }>Symmetric ({symmetric ? 'on' : 'off'})</button> <input type='file' onChange={handleImage}/>
        </div>
        <div ref={wrapper}></div>
      </center>
    </div>
  );
}

export default App;
