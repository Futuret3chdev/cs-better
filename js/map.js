// CS: Better — Map Builder (Dust II Mini style)
// Returns { sceneObjects, colliders, sites, spawnPoints }

function buildDustMini(scene) {
  const objects = [];
  const colliders = []; // {min: THREE.Vector3, max: THREE.Vector3}

  const addBox = (x, y, z, sx, sy, sz, color = 0x8d7b5e, roughness = 0.9) => {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const mat = new THREE.MeshPhongMaterial({ 
      color, 
      shininess: 15,
      specular: 0x222222
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    objects.push(mesh);

    // collider
    const halfX = sx / 2, halfY = sy / 2, halfZ = sz / 2;
    colliders.push({
      min: new THREE.Vector3(x - halfX, y - halfY, z - halfZ),
      max: new THREE.Vector3(x + halfX, y + halfY, z + halfZ),
      mesh
    });
    return mesh;
  };

  // Floor (big sand)
  const floor = addBox(0, 0.4, 0, 52, 0.8, 52, 0xc2a77a);
  // Make floor slightly darker in middle
  floor.material.color.setHex(0xb89f72);

  // Ceiling (low for "indoor" feel in some areas)
  addBox(0, 9.5, 0, 52, 0.6, 52, 0x5a5a5a);

  // Outer walls
  addBox(0, 4.5, -26, 52, 9, 1.2, 0x9a8a72); // back T
  addBox(0, 4.5, 26, 52, 9, 1.2, 0x9a8a72);  // CT side
  addBox(-26, 4.5, 0, 1.2, 9, 52, 0x9a8a72);
  addBox(26, 4.5, 0, 1.2, 9, 52, 0x9a8a72);

  // Mid hallway walls
  addBox(-7.5, 4, 8, 1.4, 7.2, 18, 0x8c7a68); // left mid
  addBox(7.5, 4, 8, 1.4, 7.2, 18, 0x8c7a68);  // right mid

  // A site (left long)
  addBox(-16, 3.5, -14, 9, 7, 1.6, 0x8c7a68); // A wall back
  addBox(-20.5, 3.5, -6, 1.6, 7, 9, 0x8c7a68); // A side wall

  // B site (right)
  addBox(16, 3.5, -11, 8, 7, 1.4, 0x8c7a68);
  addBox(12, 3.5, -5, 1.4, 7, 8, 0x8c7a68);

  // Cover boxes (classic)
  // Mid boxes
  addBox(-1.5, 2.1, 3, 3.6, 3.4, 2.8, 0x6b5c48);
  addBox(1.8, 1.8, 7.5, 2.8, 2.8, 2.8, 0x6b5c48);

  // A long box
  addBox(-13, 2.4, -8, 4.2, 4, 2.6, 0x5f5240);

  // B car / box
  addBox(15, 2.0, -3, 4.6, 3.2, 2.4, 0x4a3f32);

  // Penetrable mid wall (famous wallbang spot)
  const penWall = addBox(0, 3.8, -3, 1.2, 6.4, 5.5, 0x6e5f4e);
  penWall.userData.penetration = 0.55; // weak material

  // More cover near sites
  addBox(-8.5, 1.9, -16, 2.6, 3, 2.8, 0x5f5240);
  addBox(8, 1.9, -16, 2.8, 3, 2.6, 0x5f5240);

  // Ramp to B (visual only, use sloped box)
  const ramp = addBox(4, 2.3, -8, 3.2, 1.8, 4.5, 0x7a6b58);
  ramp.rotation.x = -0.22;

  // Sites (for planting)
  const sites = {
    A: { center: new THREE.Vector3(-15.5, 1.6, -12), radius: 6.5, name: 'A' },
    B: { center: new THREE.Vector3(13.5, 1.6, -9), radius: 5.8, name: 'B' }
  };

  // Spawn areas
  const spawns = {
    t: [
      new THREE.Vector3(-2, 1.6, 19),
      new THREE.Vector3(3, 1.6, 18),
      new THREE.Vector3(-6, 1.6, 15),
    ],
    ct: [
      new THREE.Vector3(-1, 1.6, -21),
      new THREE.Vector3(4, 1.6, -20),
      new THREE.Vector3(-5, 1.6, -18),
    ]
  };

  // Add some lights for atmosphere (lamps)
  const light1 = new THREE.PointLight(0xffeecc, 0.7, 28);
  light1.position.set(-9, 7, -9);
  scene.add(light1);

  const light2 = new THREE.PointLight(0xffddaa, 0.6, 22);
  light2.position.set(11, 6.5, -5);
  scene.add(light2);

  // Extra fill light for better visuals
  const light3 = new THREE.PointLight(0xccccff, 0.4, 40);
  light3.position.set(-5, 5, 10);
  scene.add(light3);

  // Basic ambient + sun
  const hemi = new THREE.HemisphereLight(0xaaaaff, 0x443322, 0.55);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0d0, 0.65);
  sun.position.set(18, 28, -12);
  scene.add(sun);

  return { objects, colliders, sites, spawns };
}

window.CSMap = { buildDustMini };
