// Mobile Navigation
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Active navigation link highlighting
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Project Management System
let projects = [
    {
        id: '1',
        title: 'Multi-scale Modeling of Articular Cartilage',
        description: 'Developed an experimentally validated micro-FE model to simulate cartilage mechanics and track osteoarthritis progression. Now developing a 3D multi-scale model using homogenization and optimization to link microstructure to bulk behavior.',
        technologies: ['ABAQUS', 'Python', 'Finite Element Analysis', 'Biomechanics'],
        images: []
    },
    {
        id: '2',
        title: 'Markerless Motion Capture Analysis',
        description: 'Led a team to develop a markerless motion capture framework analyzing knee biomechanics during military load carriage (30-50% body weight) to assess osteoarthritis risk. Now simulating ground reaction forces from high-intensity drills.',
        technologies: ['Computer Vision', 'Biomechanics', 'Python', 'Machine Learning'],
        images: []
    },
    {
        id: '3',
        title: 'AI-Driven Ear-Piercing Safety Assessment with VR',
        description: 'Developed an AI-driven scanning system that detects safe spots on the human ear for piercing, avoiding critical anatomical areas. Integrated results into an interactive VR simulation that overlays customizable jewelry on safe zones.',
        technologies: ['AI/ML', 'Computer Vision', 'VR', 'Python', 'Medical Imaging'],
        images: []
    },
    {
        id: '4',
        title: 'Air-Coupled Finite Element Model for Concrete',
        description: 'Validated an air-coupled finite element model experimentally to enable reliable non-destructive testing. Developed a non-contact ultrasonic method using leaky Rayleigh waves to assess early-age concrete properties.',
        technologies: ['ABAQUS', 'Ultrasonic Testing', 'Materials Science', 'NDT'],
        images: []
    },
    {
        id: '5',
        title: 'CNN-based Collagen Quantification in Cartilage',
        description: 'Modified pre-trained CNN model to analyze histological images for quantifying tissue collagen content. Validated AI results with FTIR results and developed a multiscale FE model to analyze mechanical zone-specific response.',
        technologies: ['Deep Learning', 'CNN', 'Medical Imaging', 'Python', 'TensorFlow'],
        images: []
    },
    {
        id: '6',
        title: 'Data-Driven Constitutive Modeling',
        description: 'Developed a predictive Finite Element Analysis framework by optimizing Hyperelastic model parameters to accurately match experimental cartilage data. Enables quantitative assessment of osteoarthritis progression.',
        technologies: ['ABAQUS', 'Python', 'Optimization', 'Material Modeling'],
        images: []
    }
];

// Load projects on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
});

function loadProjects() {
    const projectsGrid = document.getElementById('projectsGrid');
    projectsGrid.innerHTML = '';

    projects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsGrid.appendChild(projectCard);
    });
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const technologiesHTML = project.technologies.map(tech => 
        `<span class="tech-tag">${tech}</span>`
    ).join('');
    
    const imagesHTML = project.images.length > 0 ? 
        `<div class="project-images">
            ${project.images.map(img => 
                `<img src="${img}" alt="Project image" class="project-image" onclick="openImageModal('${img}')">`
            ).join('')}
        </div>` : '';
    
    card.innerHTML = `
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <div class="project-technologies">
            ${technologiesHTML}
        </div>
        ${imagesHTML}
        <div class="project-actions">
            <button class="btn btn-small btn-edit" onclick="editProject('${project.id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-small btn-delete" onclick="deleteProject('${project.id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    return card;
}

// Project Modal Functions
function openProjectModal(projectId = null) {
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const modalTitle = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('imagePreview').innerHTML = '';
    
    if (projectId) {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            modalTitle.textContent = 'Edit Project';
            document.getElementById('projectId').value = project.id;
            document.getElementById('projectTitle').value = project.title;
            document.getElementById('projectDescription').value = project.description;
            document.getElementById('projectTechnologies').value = project.technologies.join(', ');
            
            // Display existing images
            const imagePreview = document.getElementById('imagePreview');
            project.images.forEach(img => {
                const imgElement = document.createElement('img');
                imgElement.src = img;
                imgElement.style.width = '80px';
                imgElement.style.height = '80px';
                imgElement.style.objectFit = 'cover';
                imgElement.style.borderRadius = '8px';
                imagePreview.appendChild(imgElement);
            });
        }
    } else {
        modalTitle.textContent = 'Add New Project';
        document.getElementById('projectId').value = '';
    }
    
    modal.style.display = 'block';
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.style.display = 'none';
}

function editProject(projectId) {
    openProjectModal(projectId);
}

function deleteProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
        projects = projects.filter(p => p.id !== projectId);
        loadProjects();
        saveProjectsToLocalStorage();
    }
}

// Form submission
document.getElementById('projectForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const projectId = document.getElementById('projectId').value;
    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDescription').value;
    const technologies = document.getElementById('projectTechnologies').value
        .split(',').map(tech => tech.trim()).filter(tech => tech);
    
    // Handle file uploads
    const fileInput = document.getElementById('projectImages');
    const files = Array.from(fileInput.files);
    const images = [];
    
    // Process files (in a real application, you'd upload these to a server)
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                images.push(e.target.result);
                // Update the project after all images are loaded
                if (images.length === files.filter(f => f.type.startsWith('image/')).length) {
                    saveProject(projectId, title, description, technologies, images);
                }
            };
            reader.readAsDataURL(file);
        }
    });
    
    // If no images, save immediately
    if (files.filter(f => f.type.startsWith('image/')).length === 0) {
        const existingImages = projectId ? 
            projects.find(p => p.id === projectId)?.images || [] : [];
        saveProject(projectId, title, description, technologies, existingImages);
    }
});

function saveProject(projectId, title, description, technologies, images) {
    if (projectId) {
        // Edit existing project
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            projects[projectIndex] = {
                ...projects[projectIndex],
                title,
                description,
                technologies,
                images
            };
        }
    } else {
        // Add new project
        const newProject = {
            id: Date.now().toString(),
            title,
            description,
            technologies,
            images
        };
        projects.push(newProject);
    }
    
    loadProjects();
    closeProjectModal();
    saveProjectsToLocalStorage();
}

// Image preview for file upload
document.getElementById('projectImages').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = '';
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '8px';
                imagePreview.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });
});

// Local Storage Functions
function saveProjectsToLocalStorage() {
    localStorage.setItem('portfolioProjects', JSON.stringify(projects));
}

function loadProjectsFromLocalStorage() {
    const savedProjects = localStorage.getItem('portfolioProjects');
    if (savedProjects) {
        projects = JSON.parse(savedProjects);
    }
}

// Load projects from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProjectsFromLocalStorage();
    loadProjects();
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('projectModal');
    if (e.target === modal) {
        closeProjectModal();
    }
});

// Contact form submission
document.querySelector('.contact-form form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const name = formData.get('name') || e.target.querySelector('input[type="text"]').value;
    const email = formData.get('email') || e.target.querySelector('input[type="email"]').value;
    const message = formData.get('message') || e.target.querySelector('textarea').value;
    
    // In a real application, you would send this data to a server
    console.log('Contact form submitted:', { name, email, message });
    
    // Show success message
    alert('Thank you for your message! I will get back to you soon.');
    
    // Reset form
    e.target.reset();
});

// Animate elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-on-scroll');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const elementsToAnimate = document.querySelectorAll('.project-card, .timeline-item, .skill-category');
    elementsToAnimate.forEach(el => observer.observe(el));
});

// Image modal for viewing project images
function openImageModal(imageSrc) {
    // Create modal for image viewing
    const imageModal = document.createElement('div');
    imageModal.className = 'modal';
    imageModal.style.display = 'block';
    imageModal.innerHTML = `
        <div class="modal-content" style="text-align: center; max-width: 90vw; max-height: 90vh;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <img src="${imageSrc}" style="max-width: 100%; max-height: 80vh; object-fit: contain;">
        </div>
    `;
    
    document.body.appendChild(imageModal);
    
    // Close on click outside
    imageModal.addEventListener('click', function(e) {
        if (e.target === imageModal) {
            imageModal.remove();
        }
    });
}

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    // Close modals with Escape key
    if (e.key === 'Escape') {
        const projectModal = document.getElementById('projectModal');
        if (projectModal.style.display === 'block') {
            closeProjectModal();
        }
        
        // Close image modals
        const imageModals = document.querySelectorAll('.modal');
        imageModals.forEach(modal => {
            if (modal.id !== 'projectModal') {
                modal.remove();
            }
        });
    }
});

// Add loading states and error handling
function showLoading(element) {
    element.innerHTML = '<div class="loading">Loading...</div>';
}

function showError(element, message) {
    element.innerHTML = `<div class="error">Error: ${message}</div>`;
}

// Add search functionality for projects
function createSearchBar() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.style.cssText = 'text-align: center; margin-bottom: 2rem;';
    
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search projects...';
    searchInput.style.cssText = 'padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px; width: 300px; max-width: 100%;';
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filterProjects(searchTerm);
    });
    
    searchContainer.appendChild(searchInput);
    
    const researchSection = document.getElementById('research').querySelector('.container');
    const projectsGrid = document.getElementById('projectsGrid');
    researchSection.insertBefore(searchContainer, projectsGrid);
}

function filterProjects(searchTerm) {
    const filteredProjects = projects.filter(project => 
        project.title.toLowerCase().includes(searchTerm) ||
        project.description.toLowerCase().includes(searchTerm) ||
        project.technologies.some(tech => tech.toLowerCase().includes(searchTerm))
    );
    
    const projectsGrid = document.getElementById('projectsGrid');
    projectsGrid.innerHTML = '';
    
    filteredProjects.forEach(project => {
        const projectCard = createProjectCard(project);
        projectsGrid.appendChild(projectCard);
    });
    
    if (filteredProjects.length === 0 && searchTerm) {
        projectsGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: #666;">No projects found matching your search.</p>';
    }
}

// Initialize search bar
document.addEventListener('DOMContentLoaded', () => {
    createSearchBar();
});