import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: process.env.REACT_APP_IMAGEKIT_PUBLIC_KEY || '',
  urlEndpoint: process.env.REACT_APP_IMAGEKIT_URL_ENDPOINT || '',
  privateKey: process.env.REACT_APP_IMAGEKIT_PRIVATE_KEY || ''
});

export default imagekit;
