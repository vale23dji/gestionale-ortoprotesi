import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FileService } from '../services/file.service';

@Component({
  selector: 'app-stl-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stl-viewer-container">
      <div #rendererContainer class="renderer-container"></div>
      <div *ngIf="isLoading" class="loading-indicator">Caricamento modello in corso...</div>
      <div *ngIf="error" class="error-message">{{ error }}</div>
    </div>
  `,
  styles: [`
    .stl-viewer-container {
      position: relative;
      width: 100%;
      height: 400px;
      background-color: #f5f5f5;
      border-radius: 5px;
      overflow: hidden;
    }

    .renderer-container {
      width: 100%;
      height: 100%;
    }

    .loading-indicator {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
    }

    .error-message {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(255, 0, 0, 0.7);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
    }
  `]
})
export class StlViewerComponent implements OnInit, OnChanges, OnDestroy {
  @Input() fileUrl: string = '';
  @ViewChild('rendererContainer', { static: true }) rendererContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private model: THREE.Object3D | null = null;
  private animationFrameId: number | null = null;

  isLoading: boolean = false;
  error: string | null = null;

  constructor(private fileService: FileService) {}

  ngOnInit(): void {

    this.initThreeJs();

    if (this.fileUrl) {
      const url = this.fileService.getStlViewerUrl(this.fileUrl);
      this.loadStlModel(url);
    } else {
      console.warn('StlViewer: nessun URL fornito');
      this.error = "URL del file STL non specificato";
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fileUrl'] && !changes['fileUrl'].firstChange) {
      if (this.scene && this.fileUrl) {
        // Rimuovi il modello precedente, se esiste
        if (this.model) {
          this.scene.remove(this.model);
        }

        // Carica il nuovo modello
        const url = this.fileService.getStlViewerUrl(this.fileUrl);
        this.loadStlModel(this.fileUrl);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Pulizia risorse
    if (this.renderer) {
      this.renderer.dispose();
    }

    // Rimuovi listener per il resize
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  private initThreeJs(): void {
    // Crea una nuova scena
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    // Imposta la camera
    this.camera = new THREE.PerspectiveCamera(
      75, // FOV
      this.getContainerWidth() / this.getContainerHeight(), // Aspect ratio
      0.1, // Near clipping plane
      1000 // Far clipping plane
    );
    this.camera.position.z = 5;

    // Crea il renderer WebGL
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.getContainerWidth(), this.getContainerHeight());
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    // Aggiungi controlli per orbitare attorno al modello
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Aggiunge inerzia ai controlli
    this.controls.dampingFactor = 0.25;
    this.controls.enableZoom = true;

    // Aggiungi luci per vedere meglio il modello
    // Luce ambientale
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    this.scene.add(ambientLight);

    // Luce direzionale (simile al sole)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Luce direzionale opposta per illuminare anche il lato inferiore
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, -1);
    this.scene.add(directionalLight2);

    // Aggiungi un gestore per il ridimensionamento della finestra
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // Avvia il loop di rendering
    this.animate();
  }

  private loadStlModel(url: string): void {
    this.isLoading = true;
    this.error = null;

    const loader = new STLLoader();

    console.log('Tentativo di caricamento STL:', url);

    loader.load(
      // URL del file STL
      url,

      // Callback di successo
      (geometry) => {
        // Crea un materiale
        const material = new THREE.MeshPhongMaterial({
          color: 0x00acdd,    // Colore azzurro
          specular: 0x111111, // Riflesso speculare
          shininess: 200      // Brillantezza
        });

        // Crea la mesh con la geometria e il materiale
        const mesh = new THREE.Mesh(geometry, material);

        // Centra il modello
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox;
        if (boundingBox) {
          const center = new THREE.Vector3();
          boundingBox.getCenter(center);
          mesh.position.set(-center.x, -center.y, -center.z);

          // Adatta la camera alla dimensione del modello
          const size = new THREE.Vector3();
          boundingBox.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = this.camera.fov * (Math.PI / 180);
          let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));

          // Aggiungi un margine
          cameraZ *= 1.5;

          // Posiziona la camera
          this.camera.position.z = cameraZ;

          // Aggiorna il controllo orbita
          this.controls.update();
        }

        // Salva il riferimento al modello per poterlo rimuovere in seguito
        this.model = mesh;

        // Aggiungi il modello alla scena
        this.scene.add(mesh);

        // Termina caricamento
        this.isLoading = false;
      },

      // Callback di progresso
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% caricato');
      },

      // Callback di errore
      (error) => {
        this.error = 'Errore nel caricamento del file STL';
        this.isLoading = false;
      }
    );
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Aggiorna i controlli
    this.controls.update();

    // Renderizza la scena
    this.renderer.render(this.scene, this.camera);
  }

  private onWindowResize(): void {
    // Aggiorna camera e renderer quando la finestra cambia dimensioni
    this.camera.aspect = this.getContainerWidth() / this.getContainerHeight();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.getContainerWidth(), this.getContainerHeight());
  }

  private getContainerWidth(): number {
    return this.rendererContainer.nativeElement.clientWidth || 400;
  }

  private getContainerHeight(): number {
    return this.rendererContainer.nativeElement.clientHeight || 400;
  }

  // Aggiungere controlli per modificare il colore del modello
  setModelColor(hexColor: string): void {
    if (!this.model) return;

    // Assumendo che il modello sia una Mesh con un MeshPhongMaterial
    const mesh = this.model as THREE.Mesh;
    const material = mesh.material as THREE.MeshPhongMaterial;
    material.color.set(hexColor);
  }

  // Aggiungere funzione per esportare screenshot del modello
  takeScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }
}
