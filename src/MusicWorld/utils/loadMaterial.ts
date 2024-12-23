import * as THREE from 'three';
import yaml from 'js-yaml';

export async function loadMaterial(path: string): Promise<THREE.Material> {
    const response = await fetch(path);
    const text = await response.text();
    const data = yaml.load(text) as any;

    const color = new THREE.Color(data.Material.m_SavedProperties.m_Colors[0]._Color.r, data.Material.m_SavedProperties.m_Colors[0]._Color.g, data.Material.m_SavedProperties.m_Colors[0]._Color.b);
    const emissive = new THREE.Color(data.Material.m_SavedProperties.m_Colors[1]._EmissionColor.r, data.Material.m_SavedProperties.m_Colors[1]._EmissionColor.g, data.Material.m_SavedProperties.m_Colors[1]._EmissionColor.b);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: emissive,
        metalness: data.Material.m_SavedProperties.m_Floats[7]._Metallic,
        roughness: 1 - data.Material.m_SavedProperties.m_Floats[5]._Glossiness
    });

    return material;
}