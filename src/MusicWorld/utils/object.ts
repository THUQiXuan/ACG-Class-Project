import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export function ThreeVec3ToCannon(vec = new THREE.Vector3(0, 0, 0), offset = new THREE.Vector3(0, 0, 0)) {
    return new CANNON.Vec3(
        vec.x + offset.x, vec.y + offset.y, vec.z + offset.z
    )
}
export function CannonVec3ToThree(vec = new CANNON.Vec3(0, 0, 0)) {
    return new THREE.Vector3(
        vec.x, vec.y, vec.z
    )
}
export function groupBoxes(boxes: THREE.Mesh[], offset = new THREE.Vector3(0, 0, 0), castShadow = true) {
    const boxs = new THREE.Group
    const added: boolean[] = [] 
    for (let i = 0; i < boxes.length; i++) {
        added.push(false)
    }

    // if some boxes form a bigger box, group them
    for (let i = 0; i < boxes.length; i++) if (!added[i]) {
        // if (boxes[i].material != material) continue
        const box = boxes[i]
        let groupDirection = -1
        let lft_x = box.position.x - box.scale.x / 2, rgt_x = box.position.x + box.scale.x / 2
        let lft_z = box.position.z - box.scale.z / 2, rgt_z = box.position.z + box.scale.z / 2
        let height = box.position.y
        for (let j = i + 1; j < boxes.length; j += 1) {
            if (boxes[j].material != boxes[i].material) break
            let direction = -1
            if(Math.abs(box.position.x - boxes[j].position.x) < 0.001) direction = 0
            else if(Math.abs(box.position.z - boxes[j].position.z) < 0.001) direction = 1
            if (direction != -1 
                && (groupDirection == -1 || groupDirection == direction)
                && Math.abs(boxes[j].scale.y - box.scale.y) < 0.001
            ) {
                groupDirection = direction
                added[j] = true
                lft_x = Math.min(lft_x, boxes[j].position.x - boxes[j].scale.x / 2)
                rgt_x = Math.max(rgt_x, boxes[j].position.x + boxes[j].scale.x / 2)
                lft_z = Math.min(lft_z, boxes[j].position.z - boxes[j].scale.z / 2)
                rgt_z = Math.max(rgt_z, boxes[j].position.z + boxes[j].scale.z / 2)
            }
            else {
                break
            }
        }

        const new_box = new THREE.Mesh( new THREE.BoxGeometry(rgt_x - lft_x, boxes[i].scale.y, rgt_z - lft_z), boxes[i].material)
        new_box.position.set((lft_x + rgt_x) / 2 + offset.x, height + offset.y, (lft_z + rgt_z) / 2 + offset.z)
        new_box.castShadow = castShadow
        new_box.receiveShadow = true
        new_box.quaternion.copy(boxes[i].quaternion)    
        new_box.visible = true
        boxs.add(new_box)
    }
    return boxs

}
export function makeBox(size: number[], position: number[], color: THREE.MeshPhongMaterialParameters) {
    const box = new THREE.Mesh( new THREE.BoxGeometry(size[0], size[1], size[2]), new THREE.MeshPhongMaterial(color) )
    box.position.copy(new THREE.Vector3(position[0], position[1], position[2]))
    box.receiveShadow = true
    box.castShadow = true
    return box
}

export function makeBoxs(info: { x: number, y: number, z:number, width: number, height: number, depth: number }[], color: THREE.MeshPhongMaterialParameters) {
    const boxs = [] as THREE.Mesh[]
    for(let i=0; i<info.length; i++) {
        const boxInfo = info[i]
        const box = new THREE.Mesh( new THREE.BoxGeometry(boxInfo.width, boxInfo.height, boxInfo.depth), new THREE.MeshPhongMaterial(color) )
        box.position.copy(new THREE.Vector3(boxInfo.x, boxInfo.y, boxInfo.z))
        box.receiveShadow = true
        box.castShadow = true
        boxs.push(box)
    }
    return boxs
}

export function ThreeQuatToCannon(quat = new THREE.Quaternion(0, 0, 0, 1)) {
    return new CANNON.Quaternion(
        quat.x, quat.y, quat.z, quat.w
    )
}