declare module "three/examples/jsm/loaders/STLLoader" {
  import { Loader, BufferGeometry } from "three";
  export class STLLoader extends Loader<BufferGeometry> {
    parse(data: ArrayBuffer | string): BufferGeometry;
  }
}

declare module "three/examples/jsm/loaders/GLTFLoader" {
  import { Loader, Group } from "three";
  import { GLTF } from "three-stdlib";
  export class GLTFLoader extends Loader<GLTF> {
    parse(data: ArrayBuffer | string, path: string, onLoad: (gltf: GLTF) => void, onError?: (error: unknown) => void): void;
  }
}
