function openWhiteboard() {
        document.getElementById("whiteboardContainer").style.display = "block";
    }
    function closeWhiteboard() {
        document.getElementById("whiteboardContainer").style.display = "none";
    }

    const canvas = document.getElementById("whiteboardCanvas");
    const ctx = canvas.getContext("2d");
    let drawing = false, tool = "pencil", color = "#000000", startX, startY, imageData;

    function setTool(selectedTool) { tool = selectedTool; }
    function setColor(newColor) { color = newColor; ctx.strokeStyle = color; ctx.fillStyle = color; }
    function clearCanvas() { ctx.clearRect(0, 0, canvas.width, canvas.height); }

    canvas.addEventListener("mousedown", (e) => {
        drawing = true;
        startX = e.offsetX; startY = e.offsetY;
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (tool === "pencil" || tool === "eraser") {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
        }
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!drawing) return;
        if (tool === "pencil") {
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        } else if (tool === "eraser") {
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            ctx.strokeStyle = color;
        } else {
            ctx.putImageData(imageData, 0, 0);
            if (tool === "rectangle") {
                ctx.strokeRect(startX, startY, e.offsetX - startX, e.offsetY - startY);
            } else if (tool === "circle") {
                let radius = Math.sqrt((e.offsetX - startX) ** 2 + (e.offsetY - startY) ** 2);
                ctx.beginPath();
                ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (tool === "line") {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(e.offsetX, e.offsetY);
                ctx.stroke();
            }
        }
    });

    canvas.addEventListener("mouseup", () => {
        drawing = false;
    });