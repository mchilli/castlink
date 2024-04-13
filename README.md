# Castlink

<img src="https://raw.githubusercontent.com/mchilli/castlink/main/img/favicon.png" height="40">

The Castlink page uses the Chromecast sender API to send Media Links directly to your Cast Devices. It provides a playlist where you can add as many media links as you want, which will played one after the other.

##### API:

You can automatically insert items into the playlist by passing information as a parameter to the url. For example:
`https://mchilli.github.io/castlink/?list=title|url;title|url;title|url`

-   ##### title:
    the title that will displayed during playback
-   ##### url:
    the media link, which must be a supported format like MP4, WebM, Ogg etc.

#### special thanks:

-   [Chromecast.Link](https://chromecast.link/) by [anacrolix](https://github.com/anacrolix) - for the idea
-   [Cast.js](https://castjs.io/) - for the Chromecast sender library
-   [Font Awesome](https://fontawesome.com/) - for the icons
