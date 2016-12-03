# Exif tags management

This is using the ImageMagick's ```convert``` and ```identify``` commands.

## Installation

	npm link wg-log
	npm link wg-utils
	npm install


## Usage

	const Exif = require('wg-exif');

Extract an Exif tag from a file

	return Exif.extractEXIF(__dirname + '/image.png', function(err, exif) {
		...


## Exig tag structure

The following attributes are extracted from Exif tags

<table>
<tr>
	<td> make </td>
	<td> string </td>
	<td> Digital camera make. Ex: "Canon" </td>
</tr>
<tr>
	<td> model </td>
	<td> string </td>
	<td> Digital camera model. Ex "Canon PowerShot G5" </td>
</tr>
<tr>
	<td> width </td>
	<td> number </td>
	<td> The image width, in pixels </td>
</tr>
<tr>
	<td> height </td>
	<td> number </td>
	<td> The image height, in pixels </td>
</tr>
<tr>
	<td> resolution </td>
	<td> string </td>
	<td> The image resolution, for instance 180x180 </td>
</tr>
<tr>
	<td> orientation </td>
	<td> number </td>
	<td> The image orientation. 1=TopLeft, 2=TopRight, 3=BottomRight, 4=BottomLeft, 5=LeftTop, 6=RightTop, 7=RightBottom, 8=LeftBottom </td>
</tr>
<tr>
	<td> dateTime </td>
	<td> string </td>
	<td> The date and time at which the image was taken, in ISO format </td>
</tr>
<tr>
	<td> focalLength </td>
	<td> number </td>
	<td> The focal length. Example: 7.2 </td>
</tr>
<tr>
	<td> exposureTime </td>
	<td> number </td>
	<td> The exposure time. Example: 0.017 </td>
</tr>
<tr>
	<td> fNumber </td>
	<td> number </td>
	<td> The focal ration. Example: 2 </td>
</tr>
<tr>
	<td> hdr </td>
	<td> boolean </td>
	<td> Indicates whether the image is HDR or not </td>
</tr>
<tr>
	<td> altitude </td>
	<td> number </td>
	<td> The altitude at which the image was taken </td>
</tr>
<tr>
	<td> latitude </td>
	<td> number </td>
	<td> The latitude at which the image was taken </td>
</tr>
<tr>
	<td> longitude </td>
	<td> number </td>
	<td> The longitude at which the image was taken </td>
</tr>
</table>


