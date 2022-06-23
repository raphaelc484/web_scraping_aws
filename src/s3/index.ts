import aws from "aws-sdk";
import fs from "fs";
import unzipper from "unzipper";

interface IS3Props {
  nameDir: string;
  nameFile: string;
  pathBase: string;
}

export async function uploadFileS3({ nameDir, nameFile, pathBase }: IS3Props) {
  aws.config.update({
    secretAccessKey: process.env.ACCESS_SECRET,
    accessKeyId: process.env.ACCESS_KEY,
    region: process.env.REGION,
  });

  const s3 = new aws.S3();

  const acessBucket = await s3
    .listObjectsV2({ Bucket: "bucket-docs-nodejs" })
    .promise();

  const listFilesBucket =
    acessBucket.Contents?.map((item) => item.Key).filter(
      (item) =>
        item?.startsWith(`${nameDir}/`) && !item?.endsWith(`${nameDir}/`)
    ) || [];

  const listTest = [];

  for await (const file of listFilesBucket) {
    if (file !== undefined) {
      listTest.push({
        Key: file,
      });
    }
  }

  await Promise.all(listTest);

  if (listFilesBucket.length > 0) {
    await s3
      .deleteObjects({
        Bucket: "bucket-docs-nodejs",
        Delete: {
          Objects: listTest,
        },
      })
      .promise();
  }

  await s3
    .putObject({
      Body: fs.readFileSync(`${pathBase}/${nameFile}`),
      Bucket: "bucket-docs-nodejs",
      Key: `${nameDir}/${nameFile}`,
    })
    .promise();

  fs.unlinkSync(`${pathBase}/${nameFile}`);

  const zip = s3
    .getObject({
      Bucket: "bucket-docs-nodejs",
      Key: `${nameDir}/${nameFile}`,
    })
    .createReadStream()
    .pipe(unzipper.Parse({ forceStream: true }));

  const promises = [];

  for await (const e of zip) {
    const entry = e;

    const fileName = entry.path;
    const { type } = entry;
    if (type === "File") {
      const uploadParams = {
        Bucket: "bucket-docs-nodejs",
        Key: `${nameDir}/${fileName}`,
        Body: entry,
      };

      promises.push(s3.upload(uploadParams).promise());
    } else {
      entry.autodrain();
    }
  }

  await Promise.all(promises);
}
