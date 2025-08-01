import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const Bucket = process.env.AWS_AMPLIFY_BUCKET;
export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

const uploadStreamToS3 = async (
  data: AsyncIterable<Uint8Array>,
  key: string,
  contentType: string
) => {
  const params: PutObjectCommandInput = {
    Bucket: Bucket,
    Key: key,
    Body: await convertToBuffer(data),
    ContentType: contentType,
  };

  await s3.send(new PutObjectCommand(params));

  const url = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: Bucket,
      Key: key,
    }),
    { expiresIn: 15 * 60 }
  );

  return url;
};

async function convertToBuffer(a: AsyncIterable<Uint8Array>) {
  const result = [];
  for await (const chunk of a) {
    result.push(chunk);
  }
  return Buffer.concat(result);
}

export const s3UploaderHandler = async ({
  filename,
  data,
  contentType,
}: {
  filename: string;
  data: AsyncIterable<Uint8Array>;
  contentType: string;
}) => {
  return await uploadStreamToS3(data, filename!, contentType);
};

export const s3DeleteHandler = async (key: string) => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: Bucket,
      Key: key,
    })
  );
};

export const s3GetAllKeys = async () => {
  const { Contents } = await s3.send(
    new ListObjectsV2Command({
      Bucket: Bucket,
    })
  );

  return Contents?.map(({ Key }) => {
    return `https://${Bucket}.s3.amazonaws.com/${Key}`;
  });
};

export const uploadFile = async (file: File, key?: string, folder?: string) => {
  const Body = Buffer.from(await file.arrayBuffer());

  const folderName = (folder || '').replace(/^\/|\/$/g, '') + '/';

  const Key = `${folderName}${key}`;
  const response = await s3.send(new PutObjectCommand({ Bucket, Key, Body }));
  if (!response || response.$metadata.httpStatusCode !== 200) {
    throw new Error('Failed to upload file to S3');
  }
  const url = `https://${Bucket}.s3.amazonaws.com/${Key}`;

  return url;
};

export const deleteFile = async (key: string) => {
  const response = await s3.send(new DeleteObjectCommand({ Bucket, Key: key }));

  if (!response || response.$metadata.httpStatusCode !== 204) {
    throw new Error('Failed to delete file from S3');
  }
};
