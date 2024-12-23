import * as CANNON from "cannon-es"
import * as THREE from 'three'
import * as ObjectUtil from "../utils/object"
import Game from "./game"
import Line from "./line"

class NamedPhysicsObject extends CANNON.Body {
    name: string    
}

export default class World {

    main: CANNON.World

    line: NamedPhysicsObject | null
    game: Game | null

    lineStatus: { direction: 'x' | 'z'} = { direction: 'x'}

    constructor(game: Game) {
        this.game = game
        this.main = new CANNON.World()
        this.main.gravity.set(0, -9.82, 0)
        this.main.broadphase = new CANNON.SAPBroadphase(this.main)
        this.main.addEventListener('postStep', (e: any) => { this.run(game, e) })
        this.line = new NamedPhysicsObject({
            mass: 1,
            position: ObjectUtil.ThreeVec3ToCannon(this.game.line.line!.position),
            shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
            material: new CANNON.Material({restitution: 0, friction: 0}),
            fixedRotation: true
        })
        this.line.name = 'line'
        this.line.addEventListener('collide', (e: any) => { this.collide(game.line, e) })
    }
    dispose() {
        while (this.main.bodies.length > 0) {
            this.main.removeBody(this.main.bodies[0]);
        }
        this.main.removeEventListener('postStep', (e: any) => { this.run(this.game!, e) })
        this.line!.removeEventListener('collide', (e: any) => { this.collide(this.game!.line, e) })
        this.game = null
        this.line = null

    }

    start() {
        this.main.addBody(this.line!)
        this.line!.velocity.set(-this.game!.config.lineSpeed, 0, 0)
    }
    stop() {
        this.line!.velocity.set(0, 0, 0)
    }

    createObject(object: any, type: string, offset = new THREE.Vector3(0, 0, 0)) {
        if(type == 'box' || type == 'floor' || type == 'plane') {
            const boxes = object as THREE.Group
            for(let i = 0; i < boxes.children.length; i++) {
                const box = boxes.children[i] as THREE.Mesh
                const size = new THREE.Vector3((box.geometry as THREE.BoxGeometry).parameters.width, (box.geometry as THREE.BoxGeometry).parameters.height, (box.geometry as THREE.BoxGeometry).parameters.depth)
                const boxBody = new NamedPhysicsObject({
                    mass: 0,
                    position: ObjectUtil.ThreeVec3ToCannon(box.position, offset),
                    shape: new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2)),
                    material: new CANNON.Material({restitution: 0, friction: 0}),
                    sleepSpeedLimit: 0.1,
                    isTrigger: false
                })
                if (boxes.children.length == 1) {
                    boxBody.quaternion = ObjectUtil.ThreeQuatToCannon(box.quaternion)
                }
                boxBody.name = type
                this.main.addBody(boxBody)
            }

            return -1
        }
        return -1
    }

    public removeBody(id: number) {
        const body = this.main.getBodyById(id)
        if(body) {
            this.main.removeBody(body)
            return 1
        }
        return -1
    }

    public turn() {
        const line = this.game!.line
        if(!line.drop && this.game!.tags.status == 'run') {
            this.lineStatus.direction = this.lineStatus.direction === 'x' ? 'z' : 'x'
            if(this.lineStatus.direction == 'x') {
                this.line!.velocity.set(-this.game!.config.lineSpeed, 0, 0)
                line.line!.rotateY(-Math.PI / 2)
            } else {
                this.line!.velocity.set(0, 0, this.game!.config.lineSpeed)
                line.line!.rotateY(Math.PI / 2)
            }
            line.initLineBody(new THREE.Vector3(
                line.line!.position.x,
                line.line!.position.y,
                line.line!.position.z
            ))
        }
    }


    private lastY = 0
    private run(game: Game, event: any) {
        const line = game.line
        const nowPosition = line.line?.position.clone()
        const cy = Math.floor(this.line!.position.y * 100) / 100
        if(cy < line.line?.position.y! - 0.02) { line.drop = true }
        if(this.line!.position.y < line.line?.position.y!) {
            line.line?.position.setY(this.line!.position.y)
        }

        if(game.tags.status == 'run' || game.tags.status == 'winning') {
            line.line?.position.setX(this.line!.position.x)
            line.line?.position.setZ(this.line!.position.z)
        }
        let difference = 0
        if(nowPosition) {
            difference = nowPosition.x - this.line!.position.x == 0 ? nowPosition.z - this.line!.position.z : nowPosition.x - this.line!.position.x
        }
        line.runLine(this.lineStatus.direction, difference)
    }

    private collide(line: Line, event: any) {
        if(!event.body.isTrigger) {
            console.log(event.body.name)
            const contact = event.contact as CANNON.ContactEquation
            const contactNormal = contact.ni 
            const normal = contactNormal

            const impactVelocity = Math.floor(contact.getImpactVelocityAlongNormal())
            if(event.body.name == 'floor' ) {
                if ((Math.abs(normal.x) > 0.5 || Math.abs(normal.z) > 0.5) && this.game!.tags.status == 'run') {
                    console.log('撞墙判定（绝对值）:' + '(' + contact.bj.id + ')' + normal + '/' + Math.abs(impactVelocity))
                    this.game!.die(normal, true)
                }
                line.dropFinish()
            }
            if (event.body.name == 'plane' && this.game!.tags.status == 'run') {
                this.game!.die(normal, false)
            }
            if(event.body.name == 'box') {
                console.log('撞墙判定（绝对值）:' + '(' + contact.bj.id + ')' + normal + '/' + Math.abs(impactVelocity))
                if(this.game!.tags.status == 'run') {
                    this.game!.die(normal, true)
                }
            }
        }
    }

}