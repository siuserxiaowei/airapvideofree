import { getAdminConfigs, saveConfigs } from '@/modules/config/service';
import { getRoleByName, roleGrantsAdmin } from '@/modules/rbac/service';
import { isValidEmbedSetting } from '@/lib/embed-ids';
import { respData, respErr, respOk } from '@/lib/resp';

import type { AdminHandlerContext } from '../types';

const noStore = {
  headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  },
};

export async function GET({ request, actor }: AdminHandlerContext) {
  try {
    // Masked + protected-keys-stripped view — never send raw configs to a client.
    const configs = await getAdminConfigs();
    return respData(configs, noStore);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}

export async function POST({ request, actor }: AdminHandlerContext) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') return respErr('Invalid body');

    // The signup role goes to every new account, so it may never be an admin
    // role — otherwise settings.write alone escalates to super_admin.
    const roleName = body.initial_role_name;
    if (typeof roleName === 'string' && roleName.trim()) {
      const found = await getRoleByName(roleName.trim());
      if (found && (await roleGrantsAdmin(found.id))) {
        return respErr(
          `Role "${roleName}" carries admin permissions and cannot be the default role for new users`
        );
      }
    }

    // These values end up inside inline <script> tags / script URLs.
    for (const [name, value] of Object.entries(body)) {
      if (typeof value === 'string' && !isValidEmbedSetting(name, value)) {
        if (name === 'plausible_src') {
          return respErr(
            'plausible_src must be a same-site path (e.g. /js/script.js) or an https URL on plausible.io. For a self-hosted Plausible, add its host to VITE_PLAUSIBLE_SCRIPT_HOSTS in the deployment env and rebuild.'
          );
        }
        return respErr(`Invalid format for ${name}`);
      }
    }

    await saveConfigs(body);
    return respOk(noStore);
  } catch (error: any) {
    return respErr(error.message || 'Internal error');
  }
}
