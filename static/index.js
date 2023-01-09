var map, infoWindow;

// Array of anoymous hashes for the markers
// {lat, long}, Mark Desc, Div Description & Info
var local_objects = [];

function setmap() {
   FindObjects();
   initMap();
}

function initMap() {
  var map_center = new google.maps.LatLng(document.getElementById("lat").value, document.getElementById("lon").value);

  map = new google.maps.Map(document.getElementById("map"), {
    center: map_center,
    zoom: 11,
  });

  document.getElementById("local_objects").innerHTML = "Found " + local_objects.length + " objects.<br />";

  local_objects.forEach(marker_obj => {
	let object_marker = new google.maps.Marker({
		position: marker_obj['pos'],
    		map: map,
    		title: marker_obj['obj_desc'],
	});

        document.getElementById("local_objects").innerHTML += marker_obj['div_desc'];
  });

  infoWindow = new google.maps.InfoWindow();
}

function GMGeoLocate() {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          infoWindow.setPosition(pos);
          infoWindow.open(map);
          map.setCenter(pos);

	document.getElementById("lat").value = pos.lat;
	document.getElementById("lon").value = pos.lng;

	var cur_pos = new google.maps.Marker({
		position: pos,
    		map,
    		title: "Center of search",
	});


        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }

    setmap();
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

function FindObjects() {

  // Zero out the marker arrays
  local_objects = [];

  var obj_json = {
    "latitude": document.getElementById("lat").value,
    "longitude": document.getElementById("lon").value,
    "radius": document.getElementById("radius").value,
    "minHeight": document.getElementById("minh").value,
    "maxHeight": document.getElementById("maxh").value
  };

  let xhr = new XMLHttpRequest();
  xhr.open("POST", "http://localhost:3001/objects");
  xhr.setRequestHeader("Accept", "application/json");
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
    // console.log(xhr.status);
    // console.log(xhr.responseText);

   var obj_response = JSON.parse(xhr.responseText);

   obj_response['features'].forEach((lobject) => {
	var l_lat = lobject['geometry']['coordinates'][1];
	var l_long = lobject['geometry']['coordinates'][0];
	var obj_pos = new google.maps.LatLng(l_lat, l_long);

	var l_properties = lobject['properties'];

	// Update the div with all of the objects
	var div_desc = "";
	div_desc = l_properties['ObjectType'] + " => " + l_properties['AGL'] + " AGL (" + l_properties['AMSL'] + " MSL) (" + l_lat + "," + l_long + ")";
	div_desc += " FAAStudy: " + l_properties['FAAStudyNumber'] + " Distance: " + l_properties['distanceFromLocation'].toFixed(3) + "<br />";

	const obj_desc = l_properties['ObjectType'] + "<br />" + l_properties['AGL'] + " AGL (" + l_properties['AMSL'] + " MSL)<br />FAA Study (" + l_properties['FAAStudyNumber'] + ")";

	local_objects.push( {pos:  obj_pos, div_desc: div_desc, obj_desc: obj_desc});

   }); // End of forEach(lobject)

   initMap();

  }}; // End of xhr response callback

  xhr.send(JSON.stringify(obj_json));

}

window.initMap = initMap;
