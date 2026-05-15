// const mm = require("music-metadata");
// const { Readable } = require("stream");
// const axios = require("axios");

// const getSoundDuration = async (url) => {
//   try {
//     const response = await axios.get(url, { responseType: "stream" });
//     const metadata = await mm.parseStream(response.data, {
//       mimeType: "audio/mp3",
//     });

//     const duration = metadata.format.duration;
//     let min = Math.floor(duration / 60);
//     let sec = Math.floor(duration % 60)
//       .toString()
//       .padStart(2, "0");
//     return `${min}:${sec}`;
//   } catch (error) {
//     return {
//       status: 422,
//       message: error.message,
//     };
//   }
// };

// module.exports=getSoundDuration;