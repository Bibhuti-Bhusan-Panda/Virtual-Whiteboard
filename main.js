        const canvas = document.getElementById('whiteboard');
        const context = canvas.getContext('2d');
        let isDrawing = false;
        let isMoving = false;
        let isResizing = false;
        let selectedShapeIndex = -1;
        let resizeHandleSize = 8;
        let lastX = 0;
        let lastY = 0;
        let tool = 'pen';
        let shapes = [];
        let drag = false;
        let dragStartX, dragStartY;
        let currentColor = '#000000';


        let history = [];
        let historyStep = -1;
        
        document.getElementById('colorPicker').addEventListener('input', (e) => {
            currentColor = e.target.value;
        });

        function saveHistory() {
            if (historyStep < history.length - 1) {
                history = history.slice(0, historyStep + 1);
            }
            history.push(JSON.parse(JSON.stringify(shapes)));
            historyStep++;
        }

        function undo() {
            if (historyStep > 0) {
                historyStep--;
                shapes = JSON.parse(JSON.stringify(history[historyStep]));
                redrawCanvas();
            }
        }

        function redo() {
            if (historyStep < history.length - 1) {
                historyStep++;
                shapes = JSON.parse(JSON.stringify(history[historyStep]));
                redrawCanvas();
            }
        }

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            redrawCanvas();
        }

        function redrawCanvas() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            shapes.forEach((shape, index) => {
                drawShape(shape);
                if (index === selectedShapeIndex) {
                    drawResizeHandles(shape);
                }
            });
        }

        function drawShape(shape) {
            context.beginPath();
            context.lineWidth = 2;
            context.strokeStyle = '#000';
            context.fillStyle = '#000';

            if (shape.type === 'pen') {
                context.moveTo(shape.points[0].x, shape.points[0].y);
                shape.points.forEach(point => {
                    context.lineTo(point.x, point.y);
                });
                context.stroke();
            } else if (shape.type === 'line') {
                context.moveTo(shape.startX, shape.startY);
                context.lineTo(shape.endX, shape.endY);
                context.stroke();
            } else if (shape.type === 'rectangle') {
                context.rect(shape.startX, shape.startY, shape.endX - shape.startX, shape.endY - shape.startY);
                context.stroke();
            } else if (shape.type === 'circle') {
                context.arc(shape.startX, shape.startY, shape.radius, 0, Math.PI * 2);
                context.stroke();
            } else if (shape.type === 'text') {
                context.font = '16px Arial';
                context.fillText(shape.text, shape.x, shape.y);
            } else if (shape.type === 'image') {
                context.drawImage(shape.img, shape.startX, shape.startY, shape.endX - shape.startX, shape.endY - shape.startY);
            }
        }

        function drawResizeHandles(shape) {
            context.fillStyle = 'red';
            if (shape.type === 'rectangle' || shape.type === 'image') {
                context.fillRect(shape.startX - resizeHandleSize / 2, shape.startY - resizeHandleSize / 2, resizeHandleSize, resizeHandleSize);
                context.fillRect(shape.endX - resizeHandleSize / 2, shape.startY - resizeHandleSize / 2, resizeHandleSize, resizeHandleSize);
                context.fillRect(shape.startX - resizeHandleSize / 2, shape.endY - resizeHandleSize / 2, resizeHandleSize, resizeHandleSize);
                context.fillRect(shape.endX - resizeHandleSize / 2, shape.endY - resizeHandleSize / 2, resizeHandleSize, resizeHandleSize);
            } else if (shape.type === 'circle') {
                context.fillRect(shape.startX + shape.radius - resizeHandleSize / 2, shape.startY - resizeHandleSize / 2, resizeHandleSize, resizeHandleSize);
                context.fillRect(shape.startX - shape.radius - resizeHandleSize / 2, shape.startY - resizeHandleSize / 2, resizeHandleSize, resizeHandleSize);
                context.fillRect(shape.startX - resizeHandleSize / 2, shape.startY + shape.radius - resizeHandleSize / 2, resizeHandleSize, resizeHandleSize);
                context.fillRect(shape.startX - resizeHandleSize / 2, shape.startY - shape.radius - resizeHandleSize / 2, resizeHandleSize, resizeHandleSize);
            }
        }

        function draw(e) {
            if (!isDrawing) return;
            const { offsetX, offsetY } = e;
            context.lineWidth = 2;
            context.strokeStyle = '#000';
            context.fillStyle = '#000';

            if (tool === 'pen') {
                context.lineTo(offsetX, offsetY);
                context.stroke();
                lastX = offsetX;
                lastY = offsetY;
                shapes[shapes.length - 1].points.push({ x: offsetX, y: offsetY });
            } else if (tool === 'line') {
                redrawCanvas();
                context.beginPath();
                context.moveTo(lastX, lastY);
                context.lineTo(offsetX, offsetY);
                context.stroke();
            } else if (tool === 'rectangle') {
                redrawCanvas();
                context.beginPath();
                context.rect(lastX, lastY, offsetX - lastX, offsetY - lastY);
                context.stroke();
            } else if (tool === 'circle') {
                redrawCanvas();
                const radius = Math.sqrt(Math.pow(offsetX - lastX, 2) + Math.pow(offsetY - lastY, 2));
                context.beginPath();
                context.arc(lastX, lastY, radius, 0, Math.PI * 2);
                context.stroke();
            }
        }

        function getSelectedShapeIndex(offsetX, offsetY) {
            for (let i = shapes.length - 1; i >= 0; i--) {
                const shape = shapes[i];
                if (shape.type === 'rectangle' || shape.type === 'image') {
                    if (offsetX >= shape.startX && offsetX <= shape.endX && offsetY >= shape.startY && offsetY <= shape.endY) {
                        return i;
                    }
                } else if (shape.type === 'circle') {
                    const dist = Math.sqrt(Math.pow(offsetX - shape.startX, 2) + Math.pow(offsetY - shape.startY, 2));
                    if (dist <= shape.radius) {
                        return i;
                    }
                } else if (shape.type === 'text') {
                    context.font = '16px Arial';
                    const textWidth = context.measureText(shape.text).width;
                    const textHeight = 16;
                    if (offsetX >= shape.x && offsetX <= shape.x + textWidth && offsetY >= shape.y - textHeight && offsetY <= shape.y) {
                        return i;
                    }
                }
            }
            return -1;
        }

        function isResizeHandle(shape, offsetX, offsetY) {
            if (shape.type === 'rectangle' || shape.type === 'image') {
                const handles = [
                    { x: shape.startX, y: shape.startY },
                    { x: shape.endX, y: shape.startY },
                    { x: shape.startX, y: shape.endY },
                    { x: shape.endX, y: shape.endY },
                ];
                for (const handle of handles) {
                    if (offsetX >= handle.x - resizeHandleSize / 2 && offsetX <= handle.x + resizeHandleSize / 2 &&
                        offsetY >= handle.y - resizeHandleSize / 2 && offsetY <= handle.y + resizeHandleSize / 2) {
                        return handle;
                    }
                }
            } else if (shape.type === 'circle') {
                const handles = [
                    { x: shape.startX + shape.radius, y: shape.startY },
                    { x: shape.startX - shape.radius, y: shape.startY },
                    { x: shape.startX, y: shape.startY + shape.radius },
                    { x: shape.startX, y: shape.startY - shape.radius },
                ];
                for (const handle of handles) {
                    if (offsetX >= handle.x - resizeHandleSize / 2 && offsetX <= handle.x + resizeHandleSize / 2 &&
                        offsetY >= handle.y - resizeHandleSize / 2 && offsetY <= handle.y + resizeHandleSize / 2) {
                        return handle;
                    }
                }
            }
            return null;
        }

        canvas.addEventListener('mousedown', (e) => {
            const { offsetX, offsetY } = e;
            const shapeIndex = getSelectedShapeIndex(offsetX, offsetY);
            if (shapeIndex !== -1) {
                selectedShapeIndex = shapeIndex;
                const handle = isResizeHandle(shapes[shapeIndex], offsetX, offsetY);
                if (handle) {
                    isResizing = true;
                    currentResizeHandle = handle;
                } else {
                    isMoving = true;
                }
                lastX = offsetX;
                lastY = offsetY;
            } else {
                isDrawing = true;
                if (tool === 'pen') {
                    context.beginPath();
                    lastX = offsetX;
                    lastY = offsetY;
                    context.moveTo(lastX, lastY);
                    shapes.push({ type: 'pen', points: [{ x: lastX, y: lastY }] });
                } else {
                    lastX = offsetX;
                    lastY = offsetY;
                }
                if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
                    drag = true;
                    dragStartX = offsetX;
                    dragStartY = offsetY;
                }
                selectedShapeIndex = -1;
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const { offsetX, offsetY } = e;
            if (isDrawing) {
                draw(e);
            } else if (isMoving && selectedShapeIndex !== -1) {
                const dx = offsetX - lastX;
                const dy = offsetY - lastY;
                const shape = shapes[selectedShapeIndex];
                shape.startX += dx;
                shape.startY += dy;
                if (shape.endX !== undefined) shape.endX += dx;
                if (shape.endY !== undefined) shape.endY += dy;
                if (shape.radius !== undefined) {
                    shape.startX += dx;
                    shape.startY += dy;
                }
                if (shape.x !== undefined) shape.x += dx;
                if (shape.y !== undefined) shape.y += dy;
                lastX = offsetX;
                lastY = offsetY;
                redrawCanvas();
            } else if (isResizing && selectedShapeIndex !== -1) {
                const shape = shapes[selectedShapeIndex];
                if (shape.type === 'rectangle' || shape.type === 'image') {
                    if (currentResizeHandle.x === shape.startX && currentResizeHandle.y === shape.startY) {
                        shape.startX = offsetX;
                        shape.startY = offsetY;
                    } else if (currentResizeHandle.x === shape.endX && currentResizeHandle.y === shape.startY) {
                        shape.endX = offsetX;
                        shape.startY = offsetY;
                    } else if (currentResizeHandle.x === shape.startX && currentResizeHandle.y === shape.endY) {
                        shape.startX = offsetX;
                        shape.endY = offsetY;
                    } else if (currentResizeHandle.x === shape.endX && currentResizeHandle.y === shape.endY) {
                        shape.endX = offsetX;
                        shape.endY = offsetY;
                    }
                } else if (shape.type === 'circle') {
                    shape.radius = Math.sqrt(Math.pow(offsetX - shape.startX, 2) + Math.pow(offsetY - shape.startY, 2));
                }
                redrawCanvas();
            }
        });

        canvas.addEventListener('mouseup', (e) => {
            isDrawing = false;
            isMoving = false;
            isResizing = false;
            currentResizeHandle = null;
            if (tool === 'line' || tool === 'rectangle' || tool === 'circle') {
                shapes.push({
                    type: tool,
                    startX: dragStartX,
                    startY: dragStartY,
                    endX: e.offsetX,
                    endY: e.offsetY,
                    radius: Math.sqrt(Math.pow(e.offsetX - dragStartX, 2) + Math.pow(e.offsetY - dragStartY, 2))
                });
                saveHistory();
            } else if (tool === 'pen') {
                saveHistory();
            } else if (selectedShapeIndex !== -1) {
                saveHistory();
            }
            drag = false;
            redrawCanvas();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            context.clearRect(0, 0, canvas.width, canvas.height);
            shapes = [];
            saveHistory();
        });

        document.getElementById('undoBtn').addEventListener('click', undo);

        document.getElementById('redoBtn').addEventListener('click', redo);

        document.getElementById('eraserBtn').addEventListener('click', () => {
            tool = 'eraser';
        });

        canvas.addEventListener('mousemove', (e) => {
            if (tool === 'eraser' && isDrawing) {
                const { offsetX, offsetY } = e;
                context.clearRect(offsetX - 5, offsetY - 5, 10, 10);
            }
        });

        document.getElementById('toolSelect').addEventListener('change', (e) => {
            tool = e.target.value;
            if (tool === 'text') {
                document.getElementById('textInput').classList.remove('hidden');
                document.getElementById('textBox').focus();
            } else {
                document.getElementById('textInput').classList.add('hidden');
            }
        });

        document.getElementById('textBtn').addEventListener('click', () => {
            const text = document.getElementById('textBox').value;
            shapes.push({ type: 'text', text: text, x: lastX, y: lastY });
            document.getElementById('textInput').classList.add('hidden');
            tool = 'pen';
            saveHistory();
        });

        // document.getElementById('imageBtn').addEventListener('click', () => {
        //     document.getElementById('imageInput').click();
        // });

        // document.getElementById('imageInput').addEventListener('change', (e) => {
        //     const file = e.target.files[0];
        //     const reader = new FileReader();
        //     reader.onload = () => {
        //         const img = new Image();
        //         img.onload = () => {
        //             shapes.push({ type: 'image', img: img, startX: 0, startY: 0, endX: img.width, endY: img.height });
        //             saveHistory();
        //         };
        //         img.src = reader.result;
        //     };
        //     reader.readAsDataURL(file);
        // });

        document.getElementById('saveBtn').addEventListener('click', () => {
            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = 'whiteboard.png';
            link.click();
        });

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        saveHistory(); // Save the initial state