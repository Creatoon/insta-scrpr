import * as fs from 'fs';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as _ from './utils.js';

dotenv.config();

const options = {
  method: 'GET',
  headers: {
    'X-RapidAPI-Key': process.env.API_KEY,
    'X-RapidAPI-Host': process.env.API_HOST,
  },
};

const getMediasOrProfile = async (handle, maxID = '') => {
  options.params = { user: handle, max_id: maxID };
  return await axios.request(options);
};

const checkServer = async () => {
  options.url = 'https://instagram-scraper-2022.p.rapidapi.com/ig/server/';
  return await axios.request(options);
};

(async () => {
  try {
    const serverStatus = await checkServer();

    if (
      !(
        serverStatus &&
        serverStatus.data &&
        serverStatus.data.server === 1 &&
        serverStatus.data.server_status
      )
    ) {
      console.log(
        'Rapid API is down currently or API_HOST might be wrong, shutting down the process, try again later'
      );
      process.exit(0);
    }

    console.log('Rapid API is ready to use.');
  } catch (err) {
    console.log(err);

    console.log(
      'Rapid API is down currently, shutting down the process, try again later'
    );
    process.exit(0);
  }

  console.log('Reading the instagram Handles');

  let handles = _.getRowsAsArrayElements('./handles.csv');

  console.log('Proccessing starts now\n\n\n');

  const accountData = [];
  const folder = _.fileName();
  const fn = 'processed';
  const endd = [];

  // Creating Folders
  fs.mkdirSync(`./data/${folder}/`);
  fs.mkdirSync(`./data/${folder}/main/`);
  fs.mkdirSync(`./data/${folder}/dump/`);

  while (handles.length) {
    let handle = handles.shift();

    console.log(`${handle} profile processing now.`);

    let dumpData = {
      username: 'NA',
      profileFound: false,
      user: 'Not Available',
      reelsData: [],
    };

    let ad = {
      username: handle,
      profileFound: false,
      totalVideos: 0,
      firstUploadedOn: Number.MAX_VALUE,
      lastUploadedOn: 0,
      'average gap b/w videos in days': 0,
      maxLikes: 0,
      maxComments: 0,
      maxViewCount: 0,
      maxPlayCount: 0,
      averageLikes: 0,
      averageComments: 0,
      averageViewCount: 0,
      averagePlayCount: 0,
      name: 'NA',
      'total posts': 0,
      followers: 0,
      following: 0,
      verified: false,
      bioLink: 'NA',
      category: 'NA',
      'total igtv videos': 0,
      'can use affiliate partnership messaging as creator': false,
      'can use affiliate partnership messaging as brand': false,
      'shoppable posts count': 0,
      'has active affiliate shop': false,
      'public email': 'NA',
      'country code': 'NA',
      'public phone number': 'NA',
      'is business': false,
      'business details': {
        'contact phone number': 'NA',
        city: 'NA',
        zip: 'NA',
        latitude: 'NA',
        longitude: 'NA',
      },
    };

    try {
      options.url =
        'https://instagram-scraper-2022.p.rapidapi.com/ig/info_username/';

      const { user } = (await getMediasOrProfile(handle)).data;

      dumpData.username = handle;
      dumpData.user = user;

      if (!user) throw new Error('Page not found');

      dumpData.profileFound = true;

      ad.name = user.full_name || 'NA';
      ad['total posts'] = user.media_count;
      ad.followers = user.follower_count;
      ad.following = user.following_count;
      ad.verified = user.is_verified;
      ad.bioLink = user.external_url || 'NA';
      ad['can use affiliate partnership messaging as creator'] =
        user.can_use_affiliate_partnership_messaging_as_creator;
      ad['can use affiliate partnership messaging as brand'] =
        user.can_use_affiliate_partnership_messaging_as_brand;
      ad['shoppable posts count'] = user.shoppable_posts_count;
      ad['has active affiliate shop'] = user.has_active_affiliate_shop;
      ad['public email'] = user.public_email || 'NA';
      ad['country code'] = user.public_phone_country_code || 'NA';
      ad['public phone number'] = user.public_phone_number || 'NA';
      ad['is business'] = user.is_business;
      ad['total igtv videos'] = user.total_igtv_videos;

      if (ad['is business']) {
        ad['business details'] = {
          'contact phone number': user.contact_phone_number || 'NA',
          city: user.city_name || 'NA',
          zip: user.zip || 'NA',
          latitude: user.latitude || 'NA',
          longitude: user.longitude || 'NA',
        };
        ad.category = user.category || 'NA';
      }

      let more = true;
      let maxID = '';
      let count = 1;

      options.url =
        'https://instagram-scraper-2022.p.rapidapi.com/ig/reels_posts_username/';

      const timestamps = [];

      while (more && count <= 3) {
        const { items, paging_info } = (await getMediasOrProfile(handle, maxID))
          .data;

        dumpData.reelsData.push({
          batch: count,
          items,
        });

        if (!items) {
          throw new Error('Page not found');
        }

        console.log(`Processing Batch-${count} of ${handle}`);

        ad.totalVideos += items.length;
        items.forEach((reel) => {
          ad.maxLikes = Math.max(ad.maxLikes, reel.media.like_count);
          ad.maxComments = Math.max(ad.maxComments, reel.media.comment_count);
          ad.maxViewCount = Math.max(ad.maxViewCount, reel.media.view_count);
          ad.maxPlayCount = Math.max(ad.maxPlayCount, reel.media.play_count);
          ad.averageLikes += reel.media.like_count;
          ad.averageComments += reel.media.comment_count;
          ad.averageViewCount += reel.media.view_count;
          ad.averagePlayCount += reel.media.play_count;
          ad.firstUploadedOn = Math.min(
            ad.firstUploadedOn,
            reel.media.taken_at
          );
          ad.lastUploadedOn = Math.max(ad.lastUploadedOn, reel.media.taken_at);
          timestamps.push(reel.media.taken_at);
        });

        more = paging_info.more_available;
        maxID = paging_info.max_id;
        count++;
      }
      ad['average gap b/w videos in days'] = _.averageGap(timestamps) || 'NA';
      ad.profileFound = true;
      ad.firstUploadedOn =
        ad.firstUploadedOn === Number.MAX_VALUE
          ? 'NA'
          : _.getReelIstFromTimeStamp(ad.firstUploadedOn);
      ad.lastUploadedOn =
        ad.lastUploadedOn === 0
          ? 'NA'
          : _.getReelIstFromTimeStamp(ad.lastUploadedOn);
      ad.averageLikes = Math.round(ad.averageLikes / ad.totalVideos) || 0;
      ad.averageComments = Math.round(ad.averageComments / ad.totalVideos) || 0;
      ad.averageViewCount =
        Math.round(ad.averageViewCount / ad.totalVideos) || 0;
      ad.averagePlayCount =
        Math.round(ad.averagePlayCount / ad.totalVideos) || 0;
      ad.user;

      accountData.push(ad);

      fs.writeFileSync(
        `data/${folder}/main/${fn}.json`,
        JSON.stringify(accountData),
        'utf8'
      );
      fs.writeFileSync(
        `data/${folder}/dump/${handle}.json`,
        JSON.stringify(dumpData),
        'utf8'
      );

      maxID = '';
      console.log(`${handle} profile processed.\n\n\n`);
    } catch (err) {
      console.log(err);

      console.log(`${handle} profile failed while processing.`);

      if (err && err.message && err.message === 'Page not found') {
        ad.firstUploadedOn = 'NA';
        ad.lastUploadedOn = 'NA';
        accountData.push(ad);

        fs.writeFileSync(
          `data/${folder}/main/${fn}.json`,
          JSON.stringify(accountData),
          'utf8'
        );
        fs.writeFileSync(
          `data/${folder}/dump/${handle}.json`,
          JSON.stringify(dumpData),
          'utf8'
        );

        console.log(`${handle} not found on the instagram\n\n\n`);
      } else if (
        err &&
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        const message = err.response.data.message;

        if (
          message === "API doesn't exists" ||
          message === 'Too many requests'
        ) {
          console.log(
            `You are using the wrong rapid api host, please correct, shutting down the process.`
          );
        }

        process.exit(0);
      } else {
        endd.push(handle);
        console.log(`${handle} profile will be processed in the end.\n\n\n`);
        handles.push(handle);
        fs.writeFileSync(
          `data/${folder}/main/endd.json`,
          JSON.stringify(endd),
          'utf8'
        );
      }
    }
  }

  if (handles.length === 0) console.log('Data Generated Successfully');
})();

