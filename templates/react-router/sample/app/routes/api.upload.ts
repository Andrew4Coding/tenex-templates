import type { ActionFunctionArgs } from 'react-router';
import { uploadFile } from '~/lib/asset/s3';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const fileName = formData.get('fileName') as string;
  const folder = formData.get('folder') as string;

  if (!file) {
    return { error: 'No file provided' };
  }

  const url = await uploadFile(file, fileName, folder);
  if (!url) {
    return { error: 'File upload failed' };
  }
  return JSON.stringify({ success: true, url });
}
