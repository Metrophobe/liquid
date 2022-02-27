let audio;
let canvas;
let currentImage;
let offscreen;
let context;
let offscreenContext;
let y;
let x;
let finalWidth;
let finalHeight;
let yScale;
let xScale;
let source;
let files;
let imageToLiquify;
let luminance;
let particles;
let isTriggered;
let totalImages;

class Particle {
    constructor(ctx, [left, top, width, height]) {
        this.ctx = ctx;
        this.top = Math.floor(top);
        this.left = Math.floor(left);
        this.width = Math.floor(width);
        this.height = Math.floor(height);
        this.x = this.left + Math.floor(Math.random() * this.width);
        this.y = this.top + Math.floor(Math.random() * this.height / 1.2);
        this.size = Math.random() * 2.5;
    }

    draw = () => {
        this.ctx.beginPath();
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = `rgb(${this.lum}, ${this.lum}, ${this.lum * 1.4})`;
        this.ctx.arc(this.x, this.y, this.size * (this.lum / 200), 0, Math.PI * 2);
        this.ctx.fill();
    }

    update = () => {
        this.lum = luminance[this.y - this.top][this.x - this.left];
        this.y += 2 + Math.floor(this.lum / 100)
        if (this.y >= this.top + this.height) {
            this.y = this.top;
            this.x = Math.floor(Math.random() * this.width) + this.left;
        }
    }
}

animate = () => {
    context.globalAlpha = 0.05;
    context.fillStyle = "rgb(0,0,0)";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    particles.map(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}



clickHandler = () => {
    document.addEventListener("click", (element) => {
        if(!window.fullScreen){
            document.documentElement.requestFullscreen();
            offscreen.width = canvas.width = window.innerWidth;
            offscreen.height = canvas.height = window.innerHeight;
            audio.play();
        }
        nextImage();      
    });
}




calculateLuminance = (image, width) => {
    width = Math.floor(width);
    luminance = [];
    row = [];
    for (let b = 0; b < image.data.length; b += 4) {
        row.push(
            image.data[b] * 0.299 +
            image.data[b + 1] * 0.587 +
            image.data[b + 2] * 0.114
        );
        if (row.length == width) {
            luminance.push(row);
            row = [];
        }
    }
}

init = () => {
    //total files in folder
    totalImages = 31;
    //audio - ©Brimsone - Frustration 
    audio = new Audio("./audio/frustration.weba");
    currentImage = 0;
    files = Array.from(Array(totalImages).keys()).map(i => i++);
    //onscreen canvas
    canvas = document.createElement("canvas");
    context = canvas.getContext("2d");
    //offscreen canvas 
    offscreen = document.createElement("canvas");
    offscreenContext = offscreen.getContext("2d");
    //Set them to equal sizes
    offscreen.width = canvas.width = window.innerWidth;
    offscreen.height = canvas.height = window.innerHeight;
    //Append On Screen 
    document.body.appendChild(canvas);
    //Init collections
    isTriggered = false;
    luminance = [];
    particles = [];
    //Wireup preprocess event 
    source = new Image()
    source.addEventListener("load", (ev) => {
        preprocess();
    });
}

nextImage = () => {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    offscreenContext.clearRect(0, 0, context.canvas.width, context.canvas.height);
    source.src = `gallery/${currentImage}.jpg`;
    currentImage = currentImage < totalImages - 1 ? currentImage + 1 : 0;
}

preprocess = () => {
    xScale = 1;
    yScale = 1;
    if (source.width < 500 && source.height < 500) {
        xScale = 2;
        yScale = 2;
    }
    finalWidth = source.width * xScale;
    finalHeight = source.height * yScale;
    if (source.height > context.canvas.height) {
        yScale = (context.canvas.height - 100) / source.height;
        finalHeight = context.canvas.height - 100;
        finalWidth = source.width * yScale;
    }
    if (source.width > context.canvas.width) {
        xScale = (context.canvas.width - 100) / source.width;
        finalHeight = source.height * xScale;
        finalWidth = context.canvas.width - 100;
    }
    x = (context.canvas.width - finalWidth) / 2;
    y = (context.canvas.height - finalHeight) / 2;
    offscreenContext.drawImage(source, x, y, finalWidth, finalHeight);
    imageToLiquify = offscreenContext.getImageData(x, y, finalWidth, finalHeight);
    calculateLuminance(imageToLiquify, finalWidth);
    particles.length = 0;
    for (let p = 0; p <= 8000; p++) {
        particles.push(new Particle(context, [x, y, finalWidth, finalHeight]));
    }
    if (!isTriggered) {
        isTriggered = true;
        animate();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    init();
    nextImage();
    clickHandler();
})