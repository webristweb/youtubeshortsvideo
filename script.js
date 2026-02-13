// Video Creator Application
class VideoCreator {
    constructor() {
        this.canvas = document.getElementById('videoCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scenes = [];
        this.currentScene = 0;
        this.isPlaying = false;
        this.isPaused = false;
        this.audioElement = null;
        this.animationFrame = null;
        this.startTime = 0;
        this.pausedTime = 0;
        this.lastFrameTime = null;
        this.recordedChunks = [];
        this.mediaRecorder = null;
        this.backgroundImage = null;
        this.backgroundImageLoaded = false;
        
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.elements = {
            scriptInput: document.getElementById('scriptInput'),
            wordsPerMinute: document.getElementById('wordsPerMinute'),
            wordCount: document.getElementById('wordCount'),
            estimatedDuration: document.getElementById('estimatedDuration'),
            sceneCount: document.getElementById('sceneCount'),
            recommendation: document.getElementById('recommendation'),
            bgStyle: document.getElementById('bgStyle'),
            bgImageFile: document.getElementById('bgImageFile'),
            removeBgImage: document.getElementById('removeBgImage'),
            audioFile: document.getElementById('audioFile'),
            removeAudio: document.getElementById('removeAudio'),
            generateBtn: document.getElementById('generateBtn'),
            playBtn: document.getElementById('playBtn'),
            pauseBtn: document.getElementById('pauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            timeDisplay: document.getElementById('timeDisplay')
        };
    }

    attachEventListeners() {
        this.elements.generateBtn.addEventListener('click', () => this.generateVideo());
        this.elements.playBtn.addEventListener('click', () => this.playVideo());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseVideo());
        this.elements.resetBtn.addEventListener('click', () => this.resetVideo());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadVideo());
        this.elements.audioFile.addEventListener('change', (e) => this.loadAudio(e));
        this.elements.removeAudio.addEventListener('click', () => this.removeAudio());
        this.elements.bgImageFile.addEventListener('change', (e) => this.loadBackgroundImage(e));
        this.elements.removeBgImage.addEventListener('click', () => this.removeBackgroundImage());
        this.elements.scriptInput.addEventListener('input', () => this.updateWordCount());
        this.elements.wordsPerMinute.addEventListener('input', () => this.updateWordCount());
    }

    updateWordCount() {
        const script = this.elements.scriptInput.value.trim();
        if (!script) {
            this.elements.wordCount.textContent = '0';
            this.elements.estimatedDuration.textContent = '0:14';
            this.elements.sceneCount.textContent = '1';
            this.elements.recommendation.innerHTML = '14 second video - Koi bhi length ki script daal sakte hain, scrolling automatically adjust hogi';
            return;
        }

        // Count words
        const words = script.split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        
        // Single scrolling scene
        const sceneCount = 1;
        
        // Fixed 14 seconds duration
        const durationSeconds = 14;
        const mins = Math.floor(durationSeconds / 60);
        const secs = durationSeconds % 60;
        
        // Calculate reading speed (words per second)
        const wordsPerSecond = (wordCount / 14).toFixed(1);
        
        // Update display
        this.elements.wordCount.textContent = wordCount;
        this.elements.estimatedDuration.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        this.elements.sceneCount.textContent = sceneCount;
        
        // Provide recommendation based on word count for 14 seconds
        let recommendation = '';
        if (wordCount < 50) {
            recommendation = `✅ ${wordCount} words (${wordsPerSecond} words/sec) - Bahut slow aur readable scrolling!`;
        } else if (wordCount <= 100) {
            recommendation = `✅ ${wordCount} words (${wordsPerSecond} words/sec) - Medium speed scrolling, readable hai!`;
        } else if (wordCount <= 150) {
            recommendation = `⚠️ ${wordCount} words (${wordsPerSecond} words/sec) - Fast scrolling, thoda jaldi padhna padega!`;
        } else {
            recommendation = `⚠️ ${wordCount} words (${wordsPerSecond} words/sec) - Bahut fast scrolling! Kam words recommend hai.`;
        }
        
        this.elements.recommendation.innerHTML = `<strong>💡 Status:</strong> ${recommendation}`;
    }

    generateVideo() {
        const script = this.elements.scriptInput.value.trim();
        if (!script) {
            alert('कृपया script enter करें!');
            return;
        }

        // Fixed 14 seconds duration
        const totalWords = script.split(/\s+/).filter(word => word.length > 0).length;
        const totalDurationSeconds = 14; // Fixed duration
        
        // Create single scene with full script for scrolling
        this.scenes = [{
            text: script, // Full script in one scene
            duration: totalDurationSeconds * 1000 // 14000 milliseconds
        }];

        const totalDuration = this.getTotalDuration() / 1000;
        const mins = Math.floor(totalDuration / 60);
        const secs = Math.round(totalDuration % 60);
        
        this.elements.progressText.textContent = `✅ Video ready! Duration: ${mins}:${secs.toString().padStart(2, '0')} (${totalWords} words)`;
        this.elements.playBtn.disabled = false;
        this.elements.downloadBtn.disabled = false;
        
        // Draw first frame
        this.currentScene = 0;
        this.drawScene(0, 0);
    }

    drawScene(sceneIndex, progress) {
        if (sceneIndex >= this.scenes.length) return;

        const scene = this.scenes[sceneIndex];
        const { width, height } = this.canvas;

        // Clear canvas
        this.ctx.clearRect(0, 0, width, height);

        // Draw animated background with scene index
        this.drawBackground(progress, sceneIndex);

        // Draw decorative elements
        this.drawDecorativeElements(progress);

        // Draw text with smooth scrolling - render to offscreen first
        this.drawScrollingTextSmooth(scene.text, progress, sceneIndex);

        // Draw overlay effects
        this.drawOverlayEffects(progress);
    }

    drawScrollingTextSmooth(text, progress, sceneIndex) {
        const { width, height } = this.canvas;

        // Bigger, clearer font for better visibility
        const baseFontSize = Math.min(width, height) * 0.055; // Bigger font
        const fontFamily = 'Arial, Helvetica, sans-serif';

        this.ctx.save();
        
        // Enable anti-aliasing and smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Split into lines with proper spacing
        const lines = [];
        const paragraphs = text.split('\n');
        const maxWidth = width * 0.85; // Good margins

        this.ctx.font = `bold ${baseFontSize}px ${fontFamily}`;

        paragraphs.forEach((paragraph, pIndex) => {
            if (!paragraph.trim()) {
                lines.push(''); // Empty line for spacing
                return;
            }

            const words = paragraph.trim().split(' ');
            let currentLine = '';

            words.forEach((word) => {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = this.ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            if (currentLine) lines.push(currentLine);
            
            // Add spacing between paragraphs
            if (pIndex < paragraphs.length - 1) {
                lines.push('');
            }
        });

        const lineHeight = baseFontSize * 2.3; // More spacing between lines - no pass-pass
        const totalHeight = lines.length * lineHeight;
        
        // ULTRA ULTRA SLOW scrolling - minimal movement
        // Text barely moves, stays mostly in center
        
        // Start position: text in center-bottom
        const startY = height * 0.55; // Start at 55% (center-bottom)
        
        // End position: text in center-top
        // VERY SMALL distance = VERY SLOW movement
        const endY = height * 0.45 - (totalHeight * 0.3); // Only move 10% + small offset
        
        const scrollDistance = startY - endY;
        
        // Pure linear scrolling - constant MINIMAL speed
        // Tiny distance over 14 seconds = barely noticeable movement
        const currentY = startY - (scrollDistance * progress);

        // Use translate for GPU acceleration
        this.ctx.save();
        this.ctx.translate(0, currentY);

        // Draw each line with maximum readability and clarity
        lines.forEach((line, index) => {
            const y = index * lineHeight;
            const screenY = currentY + y;
            
            // Extended visible range for long content
            if (screenY > -lineHeight * 6 && screenY < height + lineHeight * 6) {
                // Calculate fade based on position - very gradual fade
                let alpha = 1;
                const fadeZone = height * 0.15; // 15% of screen for gentle fade
                
                if (screenY < fadeZone) {
                    // Very smooth fade in using smoothstep
                    const t = Math.max(0, Math.min(1, screenY / fadeZone));
                    alpha = t * t * (3 - 2 * t);
                } else if (screenY > height - fadeZone) {
                    // Very smooth fade out using smoothstep
                    const t = Math.max(0, Math.min(1, (height - screenY) / fadeZone));
                    alpha = t * t * (3 - 2 * t);
                }
                
                alpha = Math.max(0, Math.min(1, alpha));
                
                // Highlight text in center reading zone
                const centerY = height / 2;
                const distanceFromCenter = Math.abs(screenY - centerY);
                const centerHighlight = Math.max(0, 1 - (distanceFromCenter / (height * 0.4)));
                
                if (line.trim() && alpha > 0.01) {
                    // Deep shadow for depth and clarity
                    this.ctx.globalAlpha = alpha * 0.95;
                    this.ctx.font = `bold ${baseFontSize}px ${fontFamily}`;
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.fillText(line, width / 2 + 4, y + 4);
                    
                    // Extra thick outline for maximum contrast and clarity
                    this.ctx.globalAlpha = alpha;
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 10 + (centerHighlight * 4); // Very thick outline
                    this.ctx.lineJoin = 'round';
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
                    this.ctx.shadowBlur = 20;
                    this.ctx.strokeText(line, width / 2, y);
                    
                    // Main white text - super bright and clear
                    const brightness = 1 + (centerHighlight * 0.2);
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowOffsetX = 3;
                    this.ctx.shadowOffsetY = 3;
                    this.ctx.fillText(line, width / 2, y);
                    
                    // Extra glow for center text - makes it pop
                    if (centerHighlight > 0.5) {
                        this.ctx.globalAlpha = alpha * centerHighlight * 0.5;
                        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                        this.ctx.shadowBlur = 30;
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.fillText(line, width / 2, y);
                    }
                }
            }
        });

        this.ctx.restore();
        this.ctx.restore();
    }

    removeAudio() {
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement = null;
            this.elements.audioFile.value = '';
            this.elements.progressText.textContent = '🔇 Audio removed';
        }
    }

    drawBackground(progress, sceneIndex) {
        const { width, height } = this.canvas;

        // If custom image is loaded, use it
        if (this.backgroundImageLoaded && this.backgroundImage) {
            this.drawCustomBackground(progress);
            return;
        }

        // Otherwise use gradient backgrounds
        const style = this.elements.bgStyle.value;

        const gradients = {
            gradient1: {
                // Deep Blue Professional
                colors: ['#0a1628', '#1a2744', '#0f1f3a', '#162d4a'],
                bokehColors: ['#3a5f8f', '#4a7fb8', '#5a8fc8', '#2a4f7f']
            },
            gradient2: {
                // Navy Blue Elegant
                colors: ['#0d1b2a', '#1b263b', '#0f1e2e', '#1a3a52'],
                bokehColors: ['#415a77', '#778da9', '#5a7a9a', '#2d4a6a']
            },
            gradient3: {
                // Dark Teal Professional
                colors: ['#0a1f1f', '#1a3535', '#0f2828', '#1a4040'],
                bokehColors: ['#2d5f5f', '#3d7f7f', '#4d8f8f', '#1d4f4f']
            },
            gradient4: {
                // Midnight Blue
                colors: ['#0c1445', '#1a2465', '#0f1855', '#1a2f75'],
                bokehColors: ['#2a4495', '#3a54b5', '#4a64c5', '#1a3485']
            }
        };

        const currentGradient = gradients[style] || gradients.gradient1;
        
        // Smooth deep blue gradient
        const gradient = this.ctx.createRadialGradient(
            width * 0.5, height * 0.3, 0,
            width * 0.5, height * 0.5, Math.max(width, height) * 0.8
        );
        
        gradient.addColorStop(0, currentGradient.colors[0]);
        gradient.addColorStop(0.4, currentGradient.colors[1]);
        gradient.addColorStop(0.7, currentGradient.colors[2]);
        gradient.addColorStop(1, currentGradient.colors[3]);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);

        // Subtle bokeh effect
        this.drawBokehEffect(progress, currentGradient.bokehColors);
    }

    drawCustomBackground(progress) {
        const { width, height } = this.canvas;
        
        // Draw image to cover entire canvas
        const imgAspect = this.backgroundImage.width / this.backgroundImage.height;
        const canvasAspect = width / height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspect > canvasAspect) {
            // Image is wider
            drawHeight = height;
            drawWidth = height * imgAspect;
            offsetX = (width - drawWidth) / 2;
            offsetY = 0;
        } else {
            // Image is taller
            drawWidth = width;
            drawHeight = width / imgAspect;
            offsetX = 0;
            offsetY = (height - drawHeight) / 2;
        }
        
        this.ctx.drawImage(this.backgroundImage, offsetX, offsetY, drawWidth, drawHeight);
        
        // Add dark overlay for better text visibility
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(0, 0, width, height);
    }

    drawBokehEffect(progress, colors) {
        const { width, height } = this.canvas;
        const bokehCount = 15; // Less for cleaner look
        
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.globalAlpha = 0.15; // More subtle
        
        for (let i = 0; i < bokehCount; i++) {
            const seed = i * 137.508;
            const x = (Math.sin(seed) * 0.5 + 0.5) * width;
            const y = (Math.cos(seed) * 0.5 + 0.5) * height;
            
            const baseRadius = 40 + (i % 4) * 25;
            const radius = baseRadius + Math.sin(progress * Math.PI * 2 + i) * 8;
            const offsetX = Math.sin(progress * Math.PI + i * 0.5) * 15;
            const offsetY = Math.cos(progress * Math.PI + i * 0.3) * 15;
            
            const color = colors[i % colors.length];
            const gradient = this.ctx.createRadialGradient(
                x + offsetX, y + offsetY, 0,
                x + offsetX, y + offsetY, radius
            );
            
            gradient.addColorStop(0, color + '60');
            gradient.addColorStop(0.5, color + '30');
            gradient.addColorStop(1, color + '00');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }



    drawDecorativeElements(progress) {
        // Remove decorative corners for cleaner look like the image
        // Keep it minimal and clean
    }

    drawOverlayEffects(progress) {
        const { width, height } = this.canvas;
        
        // Very subtle vignette
        const vignetteGradient = this.ctx.createRadialGradient(
            width / 2, height / 2, height * 0.5,
            width / 2, height / 2, height * 0.9
        );
        vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        this.ctx.fillStyle = vignetteGradient;
        this.ctx.fillRect(0, 0, width, height);
    }

    drawScrollingText(text, progress, sceneIndex) {
        const { width, height } = this.canvas;

        // Clean, readable font
        const baseFontSize = Math.min(width, height) * 0.06;
        const fontFamily = 'Arial, Helvetica, sans-serif';

        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        // Enable text smoothing for crisp rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Split into lines with proper spacing
        const lines = [];
        const paragraphs = text.split('\n');
        const maxWidth = width * 0.85;

        this.ctx.font = `bold ${baseFontSize}px ${fontFamily}`;

        paragraphs.forEach((paragraph, pIndex) => {
            if (!paragraph.trim()) {
                lines.push(''); // Empty line for spacing
                return;
            }

            const words = paragraph.trim().split(' ');
            let currentLine = '';

            words.forEach((word, index) => {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = this.ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });
            if (currentLine) lines.push(currentLine);
            
            // Add spacing between paragraphs
            if (pIndex < paragraphs.length - 1) {
                lines.push('');
            }
        });

        const lineHeight = baseFontSize * 1.8; // Good spacing
        const totalHeight = lines.length * lineHeight;
        
        // Smooth scrolling from bottom to top with linear interpolation
        const startY = height + totalHeight / 2;
        const endY = -totalHeight / 2;
        const scrollDistance = startY - endY;
        
        // Use linear progress for perfectly smooth scroll (no easing jitter)
        const currentY = startY - (scrollDistance * progress);

        // Round to nearest pixel to prevent sub-pixel jitter
        const roundedY = Math.round(currentY);

        // Draw each line
        lines.forEach((line, index) => {
            const y = Math.round(roundedY - (totalHeight / 2) + (index * lineHeight));
            
            // Only draw if visible on screen (performance optimization)
            if (y > -lineHeight * 2 && y < height + lineHeight * 2) {
                // Calculate fade based on position
                let alpha = 1;
                const fadeZone = lineHeight * 3;
                
                if (y < fadeZone) {
                    alpha = Math.max(0, Math.min(1, y / fadeZone));
                } else if (y > height - fadeZone) {
                    alpha = Math.max(0, Math.min(1, (height - y) / fadeZone));
                }
                
                if (line.trim() && alpha > 0) {
                    // Shadow for depth
                    this.ctx.globalAlpha = alpha * 0.8;
                    this.ctx.font = `bold ${baseFontSize}px ${fontFamily}`;
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.shadowColor = 'transparent';
                    this.ctx.fillText(line, width / 2 + 3, y + 3);
                    
                    // Dark outline for contrast
                    this.ctx.globalAlpha = alpha;
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.lineWidth = 8;
                    this.ctx.lineJoin = 'round';
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                    this.ctx.shadowBlur = 15;
                    this.ctx.strokeText(line, width / 2, y);
                    
                    // Main white text
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                    this.ctx.shadowBlur = 8;
                    this.ctx.shadowOffsetX = 2;
                    this.ctx.shadowOffsetY = 2;
                    this.ctx.fillText(line, width / 2, y);
                }
            }
        });

        this.ctx.restore();
    }

    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    playVideo() {
        if (this.scenes.length === 0) {
            alert('पहले video generate करें!');
            return;
        }

        this.isPlaying = true;
        this.isPaused = false;
        this.elements.playBtn.disabled = true;
        this.elements.pauseBtn.disabled = false;
        
        if (this.audioElement && this.pausedTime > 0) {
            this.audioElement.play();
        } else if (this.audioElement) {
            this.audioElement.currentTime = 0;
            this.audioElement.play();
        }

        this.startTime = Date.now() - this.pausedTime;
        this.animate();
    }

    pauseVideo() {
        this.isPlaying = false;
        this.isPaused = true;
        this.elements.playBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        
        if (this.audioElement) {
            this.audioElement.pause();
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    resetVideo() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentScene = 0;
        this.pausedTime = 0;
        this.lastFrameTime = null;
        this.elements.playBtn.disabled = false;
        this.elements.pauseBtn.disabled = true;
        
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.scenes.length > 0) {
            this.drawScene(0, 0);
        }
        
        this.updateTimeDisplay(0, this.getTotalDuration());
        this.elements.progressFill.style.width = '0%';
    }

    animate() {
        if (!this.isPlaying) return;

        // Use high-resolution timestamp for smoother animation
        const now = performance.now();
        if (!this.lastFrameTime) this.lastFrameTime = now;
        
        const elapsed = Date.now() - this.startTime;
        this.pausedTime = elapsed;
        
        let totalTime = 0;
        let currentSceneIndex = 0;
        
        for (let i = 0; i < this.scenes.length; i++) {
            if (elapsed < totalTime + this.scenes[i].duration) {
                currentSceneIndex = i;
                break;
            }
            totalTime += this.scenes[i].duration;
        }

        if (currentSceneIndex >= this.scenes.length || elapsed >= this.getTotalDuration()) {
            this.isPlaying = false;
            this.elements.playBtn.disabled = false;
            this.elements.pauseBtn.disabled = true;
            this.elements.progressFill.style.width = '100%';
            this.lastFrameTime = null;
            return;
        }

        const sceneElapsed = elapsed - totalTime;
        // Use high precision progress calculation
        const progress = Math.min(Math.max(sceneElapsed / this.scenes[currentSceneIndex].duration, 0), 1);
        
        this.currentScene = currentSceneIndex;
        
        // Draw scene with precise progress
        this.drawScene(currentSceneIndex, progress);
        
        // Update progress bar
        const totalDuration = this.getTotalDuration();
        const overallProgress = (elapsed / totalDuration) * 100;
        this.elements.progressFill.style.width = `${Math.min(overallProgress, 100)}%`;
        
        this.updateTimeDisplay(elapsed, totalDuration);

        this.lastFrameTime = now;
        
        // Request next frame for smooth 60fps animation
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    getTotalDuration() {
        return this.scenes.reduce((sum, scene) => sum + scene.duration, 0);
    }

    updateTimeDisplay(current, total) {
        const formatTime = (ms) => {
            const seconds = Math.floor(ms / 1000);
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };
        
        this.elements.timeDisplay.textContent = `${formatTime(current)} / ${formatTime(total)}`;
    }

    loadAudio(event) {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            this.audioElement = new Audio(url);
            this.audioElement.loop = true;
            this.elements.progressText.textContent = `🎵 Audio loaded: ${file.name}`;
        }
    }

    loadBackgroundImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.backgroundImage = img;
                    this.backgroundImageLoaded = true;
                    this.elements.progressText.textContent = `🖼️ Background image loaded: ${file.name}`;
                    // Redraw if video is generated
                    if (this.scenes.length > 0) {
                        this.drawScene(this.currentScene, 0);
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    removeBackgroundImage() {
        this.backgroundImage = null;
        this.backgroundImageLoaded = false;
        this.elements.bgImageFile.value = '';
        this.elements.progressText.textContent = '🗑️ Background image removed';
        // Redraw if video is generated
        if (this.scenes.length > 0) {
            this.drawScene(this.currentScene, 0);
        }
    }

    async downloadVideo() {
        this.elements.downloadBtn.disabled = true;
        this.elements.progressText.textContent = '🎬 Recording video...';
        
        const stream = this.canvas.captureStream(30);
        
        if (this.audioElement) {
            const audioContext = new AudioContext();
            const source = audioContext.createMediaElementSource(this.audioElement);
            const destination = audioContext.createMediaStreamDestination();
            source.connect(destination);
            source.connect(audioContext.destination);
            
            destination.stream.getAudioTracks().forEach(track => {
                stream.addTrack(track);
            });
        }

        this.recordedChunks = [];
        this.mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 5000000
        });

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `brahmacharya-video-${Date.now()}.webm`;
            a.click();
            
            this.elements.downloadBtn.disabled = false;
            this.elements.progressText.textContent = '✅ Video downloaded successfully!';
        };

        this.mediaRecorder.start();
        
        // Reset and play for recording
        this.resetVideo();
        await new Promise(resolve => setTimeout(resolve, 100));
        this.playVideo();
        
        // Stop recording when video ends
        setTimeout(() => {
            this.mediaRecorder.stop();
            this.resetVideo();
        }, this.getTotalDuration() + 500);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new VideoCreator();
});
