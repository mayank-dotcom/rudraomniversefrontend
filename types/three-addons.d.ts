declare module "three/examples/jsm/loaders/STLLoader" {
  import { Loader, BufferGeometry } from "three";
  export class STLLoader extends Loader<BufferGeometry> {
    parse(data: ArrayBuffer | string): BufferGeometry;
  }
}
