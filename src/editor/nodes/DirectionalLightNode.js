import EditorNodeMixin from "./EditorNodeMixin";
import PhysicalDirectionalLight from "../objects/PhysicalDirectionalLight";
import SpokeDirectionalLightHelper from "../helpers/SpokeDirectionalLightHelper";

export default class DirectionalLightNode extends EditorNodeMixin(PhysicalDirectionalLight) {
  static legacyComponentName = "directional-light";

  static nodeName = "Directional Light";

  static async deserialize(editor, json) {
    const node = await super.deserialize(editor, json);

    const { color, intensity, castShadow, shadowMapResolution, shadowBias, shadowRadius } = json.components.find(
      c => c.name === "directional-light"
    ).props;

    node.color.set(color);
    node.intensity = intensity;
    node.castShadow = castShadow;
    node.shadowBias = shadowBias || 0;
    node.shadowRadius = shadowRadius === undefined ? 1 : shadowRadius;

    if (shadowMapResolution) {
      node.shadowMapResolution.fromArray(shadowMapResolution);
    }

    return node;
  }

  constructor(editor) {
    super(editor);

    this.helper = new SpokeDirectionalLightHelper(this);
    this.helper.visible = false;
    this.add(this.helper);
  }

  onAdd() {
    this.helper.update();
  }

  onChange() {
    this.helper.update();
  }

  onSelect() {
    this.helper.visible = true;
  }

  onDeselect() {
    this.helper.visible = false;
  }

  copy(source, recursive) {
    super.copy(source, false);

    if (recursive) {
      for (const child of source.children) {
        if (child !== this.helper) {
          const clonedChild = child.clone();
          this.add(clonedChild);
        }
      }
    }

    return this;
  }

  serialize() {
    return super.serialize({
      "directional-light": {
        color: this.color,
        intensity: this.intensity,
        castShadow: this.castShadow,
        shadowMapResolution: this.shadowMapResolution.toArray(),
        shadowBias: this.shadowBias,
        shadowRadius: this.shadowRadius
      }
    });
  }

  prepareForExport() {
    super.prepareForExport();
    this.remove(this.helper);
    this.addGLTFComponent("directional-light", {
      color: this.color,
      intensity: this.intensity,
      castShadow: this.castShadow,
      shadowMapResolution: this.shadowMapResolution.toArray(),
      shadowBias: this.shadowBias,
      shadowRadius: this.shadowRadius
    });
    this.replaceObject();
  }
}
