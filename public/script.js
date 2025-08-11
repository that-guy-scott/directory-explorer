class DirectoryExplorer {
    constructor() {
        this.currentPath = '';
        this.isSearching = false;
        this.searchTimeout = null;
        this.currentFilesList = [];
        this.currentFileIndex = -1;
        this.isSearchMode = false;
        
        this.pathInput = document.getElementById('pathInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.searchInput = document.getElementById('searchInput');
        this.clearSearchBtn = document.getElementById('clearSearchBtn');
        this.regexMode = document.getElementById('regexMode');
        this.breadcrumb = document.getElementById('breadcrumb');
        this.loading = document.getElementById('loading');
        this.errorMessage = document.getElementById('errorMessage');
        this.errorText = document.getElementById('errorText');
        this.fileList = document.getElementById('fileList');
        this.listBody = document.getElementById('listBody');
        this.searchResults = document.getElementById('searchResults');
        this.searchResultsTitle = document.getElementById('searchResultsTitle');
        this.searchResultsCount = document.getElementById('searchResultsCount');
        this.searchResultsBody = document.getElementById('searchResultsBody');
        this.emptyState = document.getElementById('emptyState');
        this.fileModal = document.getElementById('fileModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalBody = document.getElementById('modalBody');
        this.modalLoading = document.getElementById('modalLoading');
        this.modalClose = document.getElementById('modalClose');
        this.prevFileBtn = document.getElementById('prevFileBtn');
        this.nextFileBtn = document.getElementById('nextFileBtn');
        this.fileCounter = document.getElementById('fileCounter');
        
        this.initializeEventListeners();
        this.loadDirectory(this.pathInput.value);
    }

    initializeEventListeners() {
        this.browseBtn.addEventListener('click', () => {
            this.loadDirectory(this.pathInput.value);
        });

        this.pathInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadDirectory(this.pathInput.value);
            }
        });

        this.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        this.clearSearchBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Escape') {
                this.clearSearch();
            }
        });

        this.modalClose.addEventListener('click', () => {
            this.closeFileModal();
        });

        this.fileModal.addEventListener('click', (e) => {
            if (e.target === this.fileModal) {
                this.closeFileModal();
            }
        });

        this.prevFileBtn.addEventListener('click', () => {
            this.navigateToPreviousFile();
        });

        this.nextFileBtn.addEventListener('click', () => {
            this.navigateToNextFile();
        });

        document.addEventListener('keydown', (e) => {
            if (this.fileModal.style.display === 'flex') {
                switch (e.key) {
                    case 'Escape':
                        this.closeFileModal();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        this.navigateToPreviousFile();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this.navigateToNextFile();
                        break;
                }
            }
        });
    }

    showLoading() {
        this.loading.style.display = 'flex';
        this.errorMessage.style.display = 'none';
        this.fileList.style.display = 'none';
        this.emptyState.style.display = 'none';
    }

    hideLoading() {
        this.loading.style.display = 'none';
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorMessage.style.display = 'flex';
        this.fileList.style.display = 'none';
        this.emptyState.style.display = 'none';
        this.hideLoading();
    }

    showFileList() {
        this.fileList.style.display = 'flex';
        this.errorMessage.style.display = 'none';
        this.emptyState.style.display = 'none';
        this.searchResults.style.display = 'none';
        this.hideLoading();
    }

    showSearchResults() {
        this.searchResults.style.display = 'flex';
        this.fileList.style.display = 'none';
        this.errorMessage.style.display = 'none';
        this.emptyState.style.display = 'none';
        this.hideLoading();
    }

    showEmptyState() {
        this.emptyState.style.display = 'flex';
        this.fileList.style.display = 'none';
        this.searchResults.style.display = 'none';
        this.errorMessage.style.display = 'none';
        this.hideLoading();
    }

    updateBreadcrumb(path) {
        this.breadcrumb.innerHTML = '';
        
        if (!path || path === '/') {
            const homeItem = document.createElement('a');
            homeItem.href = '#';
            homeItem.className = 'breadcrumb-item';
            homeItem.textContent = '/';
            homeItem.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToDirectory('/');
            });
            this.breadcrumb.appendChild(homeItem);
            return;
        }

        const parts = path.split('/').filter(part => part !== '');
        let currentPath = '';

        // Root item
        const rootItem = document.createElement('a');
        rootItem.href = '#';
        rootItem.className = 'breadcrumb-item';
        rootItem.textContent = '/';
        rootItem.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToDirectory('/');
        });
        this.breadcrumb.appendChild(rootItem);

        parts.forEach((part, index) => {
            // Add separator
            const separator = document.createElement('span');
            separator.className = 'breadcrumb-separator';
            separator.innerHTML = '<i data-lucide="chevron-right"></i>';
            this.breadcrumb.appendChild(separator);

            currentPath += '/' + part;
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'breadcrumb-item';
            item.textContent = part;
            
            const pathForClick = currentPath;
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToDirectory(pathForClick);
            });
            
            this.breadcrumb.appendChild(item);
        });

        // Re-initialize Lucide icons for new elements
        lucide.createIcons();
    }

    getFileIcon(file) {
        if (file.isDirectory) {
            return 'folder';
        }
        
        const extension = file.name.split('.').pop().toLowerCase();
        const iconMap = {
            // Images
            'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'svg': 'image',
            // Documents
            'pdf': 'file-text', 'doc': 'file-text', 'docx': 'file-text', 'txt': 'file-text',
            // Code
            'js': 'file-code', 'html': 'file-code', 'css': 'file-code', 'json': 'file-code',
            'py': 'file-code', 'java': 'file-code', 'cpp': 'file-code', 'c': 'file-code',
            // Archives
            'zip': 'archive', 'rar': 'archive', 'tar': 'archive', 'gz': 'archive',
            // Video
            'mp4': 'play-circle', 'avi': 'play-circle', 'mov': 'play-circle',
            // Audio
            'mp3': 'music', 'wav': 'music', 'flac': 'music',
        };
        
        return iconMap[extension] || 'file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    handleSearchInput(query) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (!query.trim()) {
            this.clearSearch();
            return;
        }

        this.clearSearchBtn.style.display = 'flex';
        
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query.trim());
        }, 300);
    }

    async performSearch(query) {
        if (!this.currentPath) {
            this.showError('Please select a directory first');
            return;
        }

        // Validate regex if in regex mode
        const isRegexMode = this.regexMode.checked;
        if (isRegexMode) {
            try {
                // Test if the regex is valid
                const testPattern = query.startsWith('/') && query.endsWith('/') ? query.slice(1, -1) : query;
                new RegExp(testPattern, 'i');
            } catch (error) {
                this.showError('Invalid regex pattern: ' + error.message);
                return;
            }
        }

        this.showLoading();
        this.isSearching = true;

        try {
            const normalizedPath = this.currentPath.startsWith('/') ? this.currentPath.substring(1) : this.currentPath;
            let searchUrl = `/api/search/${normalizedPath}?q=${encodeURIComponent(query)}`;
            
            if (isRegexMode) {
                searchUrl += '&regex=true';
            }
            
            const response = await fetch(searchUrl);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Search failed');
            }

            this.isSearchMode = true;
            this.updateCurrentFilesList(data.results);
            this.renderSearchResults(data, query);
            
        } catch (error) {
            this.showError(error.message);
            console.error('Search error:', error);
        }
    }

    renderSearchResults(data, query) {
        this.searchResultsTitle.textContent = `Search results for "${query}"`;
        this.searchResultsCount.textContent = `${data.totalFound} results found`;
        
        if (!data.results || data.results.length === 0) {
            this.searchResultsBody.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                    <i data-lucide="search-x" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
                    <p>No files or folders found matching "${query}"</p>
                </div>
            `;
            this.showSearchResults();
            lucide.createIcons();
            return;
        }

        this.searchResultsBody.innerHTML = '';

        data.results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            
            const iconName = this.getFileIcon(result);
            const iconClass = result.isDirectory ? 'folder-icon' : 'file-icon';
            
            const highlightedName = this.highlightSearchTerm(result.name, query);
            
            resultItem.innerHTML = `
                <div class="search-result-name">
                    <i data-lucide="${iconName}" class="${iconClass}"></i>
                    <span>${highlightedName}</span>
                </div>
                <div class="search-result-path">${result.relativePath}</div>
            `;

            resultItem.addEventListener('click', () => {
                if (result.isDirectory) {
                    this.navigateToDirectory(result.path);
                } else {
                    this.openFileModal(result.path);
                }
            });

            this.searchResultsBody.appendChild(resultItem);
        });

        this.showSearchResults();
        lucide.createIcons();
    }

    highlightSearchTerm(text, searchTerm) {
        try {
            let regex;
            if (this.regexMode.checked) {
                // For regex mode, use the pattern as-is (handle /pattern/ format)
                const pattern = searchTerm.startsWith('/') && searchTerm.endsWith('/') 
                    ? searchTerm.slice(1, -1) 
                    : searchTerm;
                regex = new RegExp(`(${pattern})`, 'gi');
            } else {
                // For string mode, escape special regex characters
                const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                regex = new RegExp(`(${escapedTerm})`, 'gi');
            }
            return text.replace(regex, '<span class="search-highlight">$1</span>');
        } catch (error) {
            // Fallback to no highlighting if regex is invalid
            return text;
        }
    }

    clearSearch() {
        this.searchInput.value = '';
        this.clearSearchBtn.style.display = 'none';
        this.isSearching = false;
        this.isSearchMode = false;
        this.regexMode.checked = false;
        
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        this.showFileList();
    }

    navigateToDirectory(path) {
        this.pathInput.value = path;
        this.clearSearch();
        this.loadDirectory(path);
    }

    async openFileModal(filePath, resetIndex = true) {
        this.fileModal.style.display = 'flex';
        this.modalLoading.style.display = 'flex';
        this.modalBody.innerHTML = '';
        this.modalBody.appendChild(this.modalLoading);
        
        try {
            const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
            const response = await fetch(`/api/file/${normalizedPath}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to load file');
            }
            
            const contentType = response.headers.get('content-type');
            
            // Handle images served directly
            if (contentType && contentType.startsWith('image/')) {
                this.showImageContent(filePath, response.url);
                return;
            }
            
            // Handle JSON responses (text, code, binary info)
            const data = await response.json();
            this.modalTitle.textContent = data.name;
            
            switch (data.type) {
                case 'code':
                    this.showCodeContent(data);
                    break;
                case 'text':
                    this.showTextContent(data);
                    break;
                case 'binary':
                    this.showBinaryContent(data);
                    break;
                default:
                    throw new Error('Unsupported file type');
            }
            
        } catch (error) {
            this.showFileError(error.message);
        }

        // Update navigation context
        if (resetIndex) {
            this.currentFileIndex = this.findFileIndex(filePath);
            console.log('File opened:', filePath);
            console.log('Current index:', this.currentFileIndex);
            console.log('Total files available:', this.currentFilesList.length);
        }
        this.updateNavigationControls();
    }

    showImageContent(filePath, imageUrl) {
        const fileName = filePath.split('/').pop();
        this.modalTitle.textContent = fileName;
        this.modalLoading.style.display = 'none';
        
        this.modalBody.innerHTML = `
            <div style="padding: 1rem; text-align: center;">
                <img src="${imageUrl}" alt="${fileName}" class="file-image" />
            </div>
        `;
    }

    showCodeContent(data) {
        this.modalLoading.style.display = 'none';
        
        const languageMap = {
            'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
            'py': 'python', 'rb': 'ruby', 'php': 'php', 'java': 'java',
            'cpp': 'cpp', 'c': 'c', 'go': 'go', 'rs': 'rust',
            'html': 'html', 'css': 'css', 'json': 'json', 'xml': 'xml'
        };
        
        const language = languageMap[data.extension] || 'text';
        
        this.modalBody.innerHTML = `
            <pre class="file-code"><code class="language-${language}">${this.escapeHtml(data.content)}</code></pre>
        `;
        
        // Apply syntax highlighting
        if (window.Prism) {
            Prism.highlightAll();
        }
    }

    showTextContent(data) {
        this.modalLoading.style.display = 'none';
        
        this.modalBody.innerHTML = `
            <div class="file-text">${this.escapeHtml(data.content)}</div>
        `;
    }

    showBinaryContent(data) {
        this.modalLoading.style.display = 'none';
        
        const errorMessage = data.error || data.message || 'This file cannot be previewed';
        
        this.modalBody.innerHTML = `
            <div class="file-binary">
                <i data-lucide="file-x" style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--text-secondary);"></i>
                <h3>Cannot Preview File</h3>
                <p>${errorMessage}</p>
                
                <div class="file-info">
                    <div class="file-info-item">
                        <span>File Name:</span>
                        <span>${data.name}</span>
                    </div>
                    <div class="file-info-item">
                        <span>File Size:</span>
                        <span>${this.formatFileSize(data.size)}</span>
                    </div>
                    <div class="file-info-item">
                        <span>Modified:</span>
                        <span>${this.formatDate(data.modified)}</span>
                    </div>
                </div>
                
                <button class="download-btn" onclick="window.open('/api/file/${data.path.startsWith('/') ? data.path.substring(1) : data.path}', '_blank')">
                    <i data-lucide="download"></i>
                    Download File
                </button>
            </div>
        `;
        
        lucide.createIcons();
    }

    showFileError(message) {
        this.modalLoading.style.display = 'none';
        
        this.modalBody.innerHTML = `
            <div class="file-binary">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; margin-bottom: 1rem; color: #FF3B30;"></i>
                <h3>Error Loading File</h3>
                <p>${message}</p>
            </div>
        `;
        
        lucide.createIcons();
    }

    closeFileModal() {
        this.fileModal.style.display = 'none';
        this.modalBody.innerHTML = '';
        this.modalTitle.textContent = 'File Viewer';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateCurrentFilesList(files) {
        // Filter out directories, only keep files for navigation
        this.currentFilesList = files.filter(file => !file.isDirectory);
        console.log('Updated files list:', this.currentFilesList.length, 'files');
        console.log('Search mode:', this.isSearchMode);
    }

    findFileIndex(filePath) {
        return this.currentFilesList.findIndex(file => file.path === filePath);
    }

    updateNavigationControls() {
        if (this.currentFilesList.length <= 1) {
            this.prevFileBtn.style.display = 'none';
            this.nextFileBtn.style.display = 'none';
            this.fileCounter.style.display = 'none';
            return;
        }

        this.prevFileBtn.style.display = 'flex';
        this.nextFileBtn.style.display = 'flex';
        this.fileCounter.style.display = 'block';

        const totalFiles = this.currentFilesList.length;
        const currentIndex = this.currentFileIndex + 1; // 1-based for display
        const contextText = this.isSearchMode ? 'search results' : 'files';
        
        this.fileCounter.textContent = `${currentIndex} of ${totalFiles} ${contextText}`;
        
        this.prevFileBtn.disabled = this.currentFileIndex <= 0;
        this.nextFileBtn.disabled = this.currentFileIndex >= totalFiles - 1;
    }

    async navigateToPreviousFile() {
        if (this.currentFileIndex <= 0) return;
        
        this.currentFileIndex--;
        const file = this.currentFilesList[this.currentFileIndex];
        await this.openFileModal(file.path, false); // false = don't reset index
    }

    async navigateToNextFile() {
        if (this.currentFileIndex >= this.currentFilesList.length - 1) return;
        
        this.currentFileIndex++;
        const file = this.currentFilesList[this.currentFileIndex];
        await this.openFileModal(file.path, false); // false = don't reset index
    }

    async loadDirectory(path) {
        if (!path.trim()) {
            this.showError('Please enter a directory path');
            return;
        }

        this.showLoading();
        this.currentPath = path;

        try {
            // Remove leading slash for the API endpoint since the route captures everything after /api/files/
            const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
            const response = await fetch(`/api/files/${normalizedPath}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load directory');
            }

            this.updateBreadcrumb(path);
            this.isSearchMode = false;
            this.updateCurrentFilesList(data.files);
            this.renderFileList(data.files);
            
        } catch (error) {
            this.showError(error.message);
            console.error('Error loading directory:', error);
        }
    }

    renderFileList(files) {
        if (!files || files.length === 0) {
            this.showEmptyState();
            return;
        }

        // Sort files: directories first, then alphabetically
        const sortedFiles = files.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        this.listBody.innerHTML = '';

        sortedFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const iconName = this.getFileIcon(file);
            const iconClass = file.isDirectory ? 'folder-icon' : 'file-icon';
            
            fileItem.innerHTML = `
                <div class="file-name">
                    <i data-lucide="${iconName}" class="${iconClass}"></i>
                    <span>${file.name}</span>
                </div>
                <div class="file-size">${file.isDirectory ? '—' : this.formatFileSize(file.size)}</div>
                <div class="file-date">${this.formatDate(file.modified)}</div>
            `;

            // Add click handlers
            fileItem.style.cursor = 'pointer';
            fileItem.addEventListener('click', () => {
                if (file.isDirectory) {
                    this.navigateToDirectory(file.path);
                } else {
                    this.openFileModal(file.path);
                }
            });

            this.listBody.appendChild(fileItem);
        });

        this.showFileList();
        
        // Re-initialize Lucide icons for new elements
        lucide.createIcons();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DirectoryExplorer();
});