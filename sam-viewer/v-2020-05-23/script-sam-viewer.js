
aGithub.href = "https://github.com/HoareLea/sam-viewer/";

const version = "2020-05-23";

const description =
`
Online Sustainable Analytical Model (SAM) JSON file interactive 3D viewer in your browser 
designed to be forked, hacked and remixed using the WebGL and the 
<a href="https://threejs.org" target="_blank">Three.js</a> JavaScript library
`;



let json;
let group;

const v2 = ( x, y ) => new THREE.Vector2( x, y );


const colors = {

	InteriorWall: 0x008000,
	ExteriorWall: 0xFB400,
	Roof: 0x800000,
	InteriorFloor: 0x80FFFF,
	ExposedFloor: 0x40B4FF,
	Shade: 0xFFCE9D,
	UndergroundWall: 0xA55200,
	UndergroundSlab: 0x804000,
	Ceiling: 0xFF8080,
	Air: 0xFFFF00,
	UndergroundCeiling: 0x408080,
	RaisedFloor: 0x4B417D,
	SlabOnGrade: 0x804000,
	FreestandingColumn: 0x808080,
	EmbeddedColumn: 0x80806E

};


let timeStart; 



function init() {

	timeStart = performance.now();

	divDescription.innerHTML = description;

	aGlitch.href = "https://glitch.com/~hoarelea-sam-viewer";

	aGithub.href = 
	"https://github.com/HoareLea/sam-viewer/";
	
	aTitle.innerHTML += ` ${ version }`;

	THR.init();

	THR.animate();

	const url = "../../sam-sample-files/TwoLevelsRevit.JSON";

	requestFile(url, onLoadSam);

	FRJ.init();

	HRT.initHeart();

}



function onLoadSam(response) {

	json = response;
	console.log("json", json);

	selPanel.innerHTML = new Array(json.length).fill().map((item, i) => `<option>${i} ${json[i].Name}</option>`);

	scene.remove(group);

	group = new THREE.Group();

	const panels = json.map((item, index) => {

		const shape = getJsonLine(index);

		group.add(shape);

		return shape;

	});

	scene.add(group);

	THR.zoomObjectBoundingSphere();

	RAY.intersectObjects = panels;

	RAY.addMouseMove();

}



function getJsonLine(index) {

	item = json[index]


	const holes = [];

	if ( item.Apertures ) {

		//console.log( "item.Apertures", item.Apertures );
		for ( aperture of item.Apertures ) {

			//console.log( "aperture", aperture );

			let vertices = [];

			let colors = ["red", "green", "yellow", "blue"];
			for (let edge of aperture.PlanarBoundary3D.Edge2DLoop.BoundaryEdge2Ds) {
		
				//console.log( "edge", edge.Curve2D );
		
				const cO = edge.Curve2D.Origin;
				const cOV = new THREE.Vector3(cO.X, cO.Y, 0);
				//console.log( "cO", cO.X, cO.Y );
		
				const cV = edge.Curve2D.Vector;
				const cVV = new THREE.Vector3(cO.X + cV.X, cO.Y + cV.Y, 0);
				//console.log( "cV", cO.X + cV.X, cO.Y + cV.Y );
		
				let line = getLine([cOV, cVV], colors.pop());
				//line.position.copy(origin);
				//line.up.copy( axisX ); 
				//line.lookAt(origin.clone().add(normal));
		
				group.add( line );
		
				vertices.push(v2(cVV.x, cVV.y));
		
			}

			const hole = new THREE.Path().setFromPoints( vertices );

			holes.push( hole );
		
			//console.log( "vertices", vertices );

		}

	}
		

	
	let b3d = item.PlanarBoundary3D;
	//console.log( "\n\nBoundary", b3d  );

	//b3d = json[ 0 ].PlanarBoundary3D;5

	const pO = b3d.Plane.Origin;
	//console.log( "plane.origin", b3d.Plane.Origin );

	const origin = new THREE.Vector3(pO.X, pO.Y, pO.Z);
	//console.log( "origin", origin );

	const mesh = THR.addMesh(0.5);
	mesh.position.copy(origin);
	//console.log( "mesh", mesh );

	const pN = b3d.Plane.Normal;
	const normal = new THREE.Vector3(pN.X, pN.Y, pN.Z);
	//console.log( "normal", normal );

	const pX = b3d.Plane.AxisX;
	const axisX = new THREE.Vector3(pX.X, pX.Y, pX.Z);

	let line = getLine([origin, origin.clone().add(normal)], "blue", origin, normal);
	group.add(line);

	line = getLine([origin, origin.clone().add(axisX)], "red", origin, normal);
	group.add(line);


	let vertices = [];

	//let colors = ["red", "green", "yellow", "blue"];
	for (let edge of b3d.Edge2DLoop.BoundaryEdge2Ds) {

		//console.log( "edge", edge.Curve2D );

		const cO = edge.Curve2D.Origin;
		const cOV = new THREE.Vector3(cO.X, cO.Y, 0);
		//console.log( "cO", cO.X, cO.Y );

		const cV = edge.Curve2D.Vector;
		const cVV = new THREE.Vector3(cO.X + cV.X, cO.Y + cV.Y, 0);
		//console.log( "cV", cO.X + cV.X, cO.Y + cV.Y );

		// let line = getLine([cOV, cVV], colors.pop());
		// line.position.copy(origin);
		// //line.up.copy( axisX ); 
		// line.lookAt(origin.clone().add(normal));

		//group.add( line );

		vertices.push(v2(cVV.x, cVV.y));

	}
	//console.log( "vertices", vertices );

	const color = colors[ item.PanelType];
	//console.log( "color", color, item.PanelType );

	let shape = getShape(vertices, holes, color );
	shape.position.copy(origin);
	shape.up.copy(axisX);

	shape.lookAt(origin.clone().add(normal));

	shape.userData.index = index;
	shape.userData.json = item;

	return shape;


}



function getLine(vertices, color = 0x000000) {

	const geometry = new THREE.Geometry();
	geometry.vertices = vertices;
	//geometry.applyMatrix4( new THREE.Matrix4().makeRotationZ( -0.5 * Math.PI ) );


	const material = new THREE.LineBasicMaterial({ color: color });
	const line = new THREE.Line(geometry, material);

	return line;

}


function getShape(vertices, holes, color ) {

	const shapeGeo = new THREE.Shape(vertices);
	shapeGeo.holes = holes;
	const geometry = new THREE.ShapeGeometry(shapeGeo);
	geometry.applyMatrix4(new THREE.Matrix4().makeRotationZ(0.5 * Math.PI));

	const material = new THREE.MeshPhongMaterial({ color: color, opacity: 0.85, side: 2, transparent: true });
	const shape = new THREE.Mesh(geometry, material);
	shape.receiveShadow = true;
	shape.castShadow = true;

	return shape;

}


//////////

function showPanel() {

	scene.remove(group);

	group = new THREE.Group();

	const shape = getJsonLine(selPanel.selectedIndex);

	group.add(shape);

	scene.add(group);

	RAY.intersectObjects = [shape];

	setData(shape.userData.index);

}



function setData(index) {

	const item = json[index];

	pO = item.PlanarBoundary3D.Plane.Origin;
	pN = item.PlanarBoundary3D.Plane.Normal;
	pX = item.PlanarBoundary3D.Plane.AxisX;

	edges = [];

	for (let edge of item.PlanarBoundary3D.Edge2DLoop.BoundaryEdge2Ds) {

		const cO = edge.Curve2D.Origin;
		//console.log( "eO", cO.X, cO.Y );

		const cV = edge.Curve2D.Vector;
		//console.log( "eV", cV.X, cV.Y );

		edges.push(`
		eO ${ cO.X.toLocaleString()}, ${cO.Y.toLocaleString()}<br>
		eV ${ cV.X.toLocaleString()}, ${cV.Y.toLocaleString()}<br><br>`);

	}

	htm =

	`
	Origin:<br>${ pO.X.toLocaleString()}, ${pO.Y.toLocaleString()}, ${pO.Z.toLocaleString()}<br><br>
	Normal:<br>${ pN.X}, ${pN.Y}, ${pN.Z}<br><br>
	X-axis:<br>${ pX.X}, ${pX.Y}, ${pX.Z}<br><br>
	Edges:<br>${ edges.join("")}
	`;


	divLog.innerHTML = htm;

}



RAY.getHtm = function (intersected) {

	//console.log( "intersected", intersected );

	const json = intersected.object.userData.json;

	//let htm = JSON.stringify( intersected.object.userData.json, null, "" );
	//console.log( "json", json );
	//htm = htm ? htm.replace( /,/g, ",<br>") : "&nbsp;";

	const apps = json.Apertures && json.Apertures.length ? json.Apertures.length : 0;
	const htm = `Name: ${json.Name}<br>
	Type: ${ json.PanelType}<br>
	Apertures: ${ apps}`;

	setData(intersected.object.userData.index)

	return htm;

};


//////////




function requestFile(url, callback) {

	const xhr = new XMLHttpRequest();
	xhr.open('GET', url, true);
	xhr.responseType = "json";
	xhr.onerror = (xhr) => console.log('error:', xhr);
	//xhr.onprogress = ( xhr ) => console.log( 'bytes loaded:', xhr.loaded );
	xhr.onload = (xhr) => callback(xhr.target.response);
	xhr.send(null);

}