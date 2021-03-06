import THREE from "../../vendor/three";
import eventToMessage from "../utils/eventToMessage";
import loadErrorTexture from "../utils/loadErrorTexture";

export const ImageProjection = {
  Flat: "flat",
  Equirectangular360: "360-equirectangular"
};

export default class Image extends THREE.Object3D {
  constructor() {
    super();
    this._src = null;
    this._projection = "flat";

    const geometry = new THREE.PlaneGeometry();
    const material = new THREE.MeshBasicMaterial();
    material.side = THREE.DoubleSide;
    this._mesh = new THREE.Mesh(geometry, material);
    this.add(this._mesh);
    this._texture = null;
  }

  get src() {
    return this._src;
  }

  set src(src) {
    this.load(src).catch(console.error);
  }

  loadTexture(src) {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(src, resolve, null, e => reject(`Error loading Image. ${eventToMessage(e)}`));
    });
  }

  get projection() {
    return this._projection;
  }

  set projection(projection) {
    const material = new THREE.MeshBasicMaterial();

    let geometry;

    if (projection === "360-equirectangular") {
      geometry = new THREE.SphereBufferGeometry(1, 64, 32);
      // invert the geometry on the x-axis so that all of the faces point inward
      geometry.scale(-1, 1, 1);
    } else {
      geometry = new THREE.PlaneGeometry();
      material.side = THREE.DoubleSide;
    }

    material.map = this._texture;

    this._projection = projection;

    // Replace existing mesh
    this.remove(this._mesh);
    this._mesh = new THREE.Mesh(geometry, material);
    this.add(this._mesh);

    this.onResize();
  }

  async load(src) {
    this._src = src;
    this._mesh.visible = false;

    const material = this._mesh.material;

    if (material.map) {
      material.map.dispose();
    }

    if (!src) {
      material.map = null;
      this._mesh.visible = true;
      return;
    }

    let texture;

    try {
      if (src) {
        texture = await this.loadTexture(src);
        // TODO: resize to maintain aspect ratio but still allow scaling.
        texture.encoding = THREE.sRGBEncoding;
        texture.minFilter = THREE.LinearFilter;
      } else {
        texture = await loadErrorTexture();
      }
    } catch (err) {
      texture = await loadErrorTexture();
      console.warn(`Error loading image node with src: "${src}": "${err.message || "unknown error"}"`);
    }

    this._texture = texture;

    this.onResize();

    if (texture.format === THREE.RGBAFormat) {
      this._mesh.material.transparent = true;
    }

    this._mesh.material.map = this._texture;
    this._mesh.material.needsUpdate = true;
    this._mesh.visible = true;

    return this;
  }

  onResize() {
    if (this._texture && this.projection === ImageProjection.Flat) {
      const ratio = (this._texture.image.height || 1.0) / (this._texture.image.width || 1.0);
      const width = Math.min(1.0, 1.0 / ratio);
      const height = Math.min(1.0, ratio);
      this._mesh.scale.set(width, height, 1);
    }
  }

  copy(source, recursive) {
    super.copy(source, false);

    for (const child of source.children) {
      if (recursive === true && child !== source._mesh) {
        this.add(child.clone());
      }
    }

    this.projection = source.projection;
    this.src = source.src;

    return this;
  }
}
