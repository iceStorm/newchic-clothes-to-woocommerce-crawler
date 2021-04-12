import cheerio, { Cheerio, Root, } from 'cheerio';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Parser } from 'json2csv';
import { Clothes, DetailResult, } from './types';



function run() {
  axios.get(`https://sea.newchic.com/api/v1/index/getCategoryRecommend/?pageSize=100&page=1`)
    .then(async response => {

      //  converting to an array to get intellisense
      const list = Array.from(response.data.result.list);


      //  mapping data to woocommerce-convertable
      const data = list.map((record: any, index, arr) => {
        //  process each clothes item
        return getProductAndVariants(record);
      });


      //  processing - waiting for the promises to finish
      Promise.all(data)
        .then(csv => {

          const merged = [].concat.apply([], csv);
          save(merged);
          // console.log('the csv: ', merged);
        })
        .catch(err => {
          console.log(err);
        });
    })
    .catch(err => {
      console.log(err);
    });
}

function save(data) {
  try {
    const json2csvParser = new Parser({defaultValue: '', includeEmptyRows: true,});
    const csv = json2csvParser.parse(data);

    fs.writeFileSync(path.resolve(__dirname, '../result/data.csv'), csv, {
      encoding: 'utf-8',
    });
  }
  catch(err: any) {
    console.log(err);
  }
}



function getProductAndVariants(record: any) {
  return new Promise<any>((resolve, reject) => {

    //  creating and initializing the root clothes
    let clothes: Clothes[] = [{
      Type: 'variable',
      Categories: record.categories_name,
      SKU: record.products_model,
      Name: record.products_name,
      Published: 1,
      'Visibility in catalog': 'visible',
      'In stock?': 1,
      'Regular price': record.products_price,
      'Sale price': record.final_price,
      "Attribute 1 name": 'Color',
      "Attribute 1 visible": 1,
      "Attribute 1 global": 1,
      "Attribute 2 name": 'Size',
      "Attribute 2 visible": 1,
      "Attribute 2 global": 1,
      Images: '',
    }];


    getDetail(record.url, clothes[0])
      .then(data => {
        //  set the gallery images for the root clothes
        clothes[0].Images = data.galleryImages;

        //  appending the variant clotheses to the root one
        return resolve(clothes.concat(data.variants));
      })
      .catch(err => {
        return reject(err);
      })
  });
}

function getDetail(url: string, rootClothes: Clothes) {
  return new Promise<DetailResult>((resolve, reject) => {

    console.log('getting detail..', url);
    

    //  retriving the detail clothes page content
    axios.get(url)
      .then(async response => {

        //  saving the template for insighting..
        fs.writeFileSync(path.resolve(__dirname, 'detail.html'), response.data);

        //  initializing the cheerio instance
        const $ = cheerio.load(response.data);

        let details = {
          galleryImages: await getGalleryImages($),
          variants: await getVariantProducts(rootClothes, $),
        };


        //  getting images from variants
        const variantImages = details.variants.map((clothes) => {
          return clothes.Images;
        });


        //  resolving data..
        return resolve({
          galleryImages: details.galleryImages.concat(variantImages).join(','),
          variants: details.variants,
        });
      })
      .catch(err => {
        return reject(err);
      });
  });
}



function getGalleryImages($: Root) {
  return new Promise<any[]>((resolve, reject) => {
    const selector = '.product-view-image-block .ui-swiper-list li img';

    const theImages = $(selector).map((index, elem) => {
      return $(elem).attr('data-large-image');
    }).get();

    return resolve(theImages);
  });
}

function getVariantProducts(rootClothes: Clothes, $: Root) {
  return new Promise<Clothes[]>((resolve, reject) => {

    Promise.all([getColorVariants($), getSizeViriants($)])
      .then(data => {

        const colorVariants = data[0];
        const sizeVariants = data[1];


        rootClothes['Attribute 1 value(s)'] = colorVariants.map((item) => item.name).join(',');
        rootClothes['Attribute 2 value(s)'] = sizeVariants.map((item) => item.size).join(',');
        

        const variantClotheses = colorVariants.map((item, index, arr) => {
          return <Clothes>{
            Type: 'variation',
            Categories: '',
            SKU: `${rootClothes.SKU}-${item.name}`,
            Parent: rootClothes.SKU,
            Name: `${rootClothes.Name}-${item.name}`,
            Published: 1,
            'Visibility in catalog': 'visible',
            'In stock?': 1,
            'Regular price': rootClothes['Regular price'],
            'Sale price': rootClothes['Sale price'],
            "Attribute 1 name": 'Color',
            "Attribute 1 global": 1,
            "Attribute 1 value(s)": item.name,
            "Attribute 2 name": 'Size',
            "Attribute 2 global": 1,
            // "Attribute 2 value(s)": rootClothes['Attribute 2 value(s)'],
            Images: item.url,
          };
        });


        return resolve(variantClotheses);
      })
      .catch(err => {
        return reject(err);
      });
  });
}

function getColorVariants($: Root) {
  return new Promise<{ name: string, url: string }[]>((resolve, reject) => {

    //  build the selector
    const selector = '.mx-lg-n6 .product-info-value-list-js';
    // console.log('selector:', $(selector).length, $(selector).first().html());
    // console.log($(selector).first().find('> li').length);
    

    const items = $(selector).first().find('> li').toArray().map((elem, index) => {
      return {
        name: $(elem).find('.px-lg-6.pb-lg-8 > div').attr('title'),
        url: $(elem).find('.px-lg-6.pb-lg-8 > div > div > img').attr('data-large-image'),
      };
    });


    return resolve(items);
  });
}

function getSizeViriants($: Root) {
  return new Promise<{ size: string }[]>((resolve, reject) => {

    //  build the selector
    const selector = '.mx-lg-n6 .product-info-value-list-js';
    // console.log('selector:', $(selector).length, $(selector).first().html());
    // console.log($(selector).last().find('> li').length);
    // console.log($(selector).last().find('> li').html());

    const items = $(selector).last().find('> li').toArray().map((elem, index) => {
      return {
        size: $(elem).find('> div > div').text().trim(),
      };
    });

    return resolve(items);
  });
}

run();
