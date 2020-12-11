import { apiDelay, random } from '../util';
import {
  getFollowings,
  getSpecialFollowings,
  getVideosByUpId,
} from '../net/userInfoRequest';
import { getRegionRankingVideos } from '../net/videoRequest';
import { TaskConfig } from '../globalVar';
import { FollowingsDto } from '../dto/UserInfo.dto';

class AidInfo {
  msg: string;
  data: {
    aid?: number;
    title?: string;
    author?: string;
  };
}

/**
 * 从关注列表随机获取一个视频
 * @param special 是否只获取特别关注列表
 */
export async function getAidByFollowing(
  special: boolean = true
): Promise<AidInfo> {
  try {
    const uid = TaskConfig.USERID;
    let tempData: FollowingsDto;
    if (special) {
      tempData = await getSpecialFollowings();
    } else {
      tempData = await getFollowings(uid);
    }

    const { data, message } = tempData;

    if (data) {
      await apiDelay();

      const { mid } = data[random(data.length)];

      return await getAidByUp(mid);
    }
    return {
      msg: special
        ? `未获取到特别关注列表: ${message}`
        : `未获取到关注列表: ${message}`,
      data: {},
    };
  } catch (error) {
    return {
      msg: error.message,
      data: {},
    };
  }
}

/**
 * 从随机类别排行中获取一个视频
 */
export async function getAidByRegionRank(): Promise<AidInfo> {
  const arr = [1, 3, 4, 5, 160, 22, 119];
  const rid = arr[random(arr.length)];

  try {
    const { data, message } = await getRegionRankingVideos(rid, 0);
    if (data) {
      const { aid, title, author } = data[random(data.length)];
      return {
        msg: '0',
        data: {
          aid: Number(aid),
          title,
          author,
        },
      };
    }
    return {
      msg: `未获取到排行信息: ${message}`,
      data: {},
    };
  } catch (error) {
    return {
      msg: error.message,
      data: {},
    };
  }
}

/**
 * 从自定义up主列表中随机选择
 */
export async function getAidByCustomizeUp(): Promise<AidInfo> {
  const customizeUp = TaskConfig.BILI_CUSTOMIZE_UP;

  if (customizeUp.length === 0) {
    return {
      msg: '自定义up列表为空',
      data: {},
    };
  }
  const mid = customizeUp[random(customizeUp.length)];
  return await getAidByUp(mid);
}

/**
 * 获取指定up主的随机视频
 * @param id up主ip
 */
export async function getAidByUp(id: number): Promise<AidInfo> {
  try {
    const { message, data } = await getVideosByUpId(id);

    if (data) {
      const avList = data.media_list;
      const { id, title, upper } = avList[random(avList.length)];
      return {
        msg: '0',
        data: {
          aid: id,
          title,
          author: upper.name,
        },
      };
    }
    return {
      msg: `通过uid获取视频失败: ${message}`,
      data: {},
    };
  } catch (error) {
    return {
      msg: error.message,
      data: {},
    };
  }
}

/**
 * 按照优先顺序调用不同函数获取aid
 */
export async function getAidByByPriority() {
  let data: AidInfo;
  const aidFunArray: Array<() => Promise<AidInfo>> = [
    getAidByCustomizeUp,
    getAidByFollowing,
    () => getAidByFollowing(false),
    getAidByRegionRank,
  ];
  for (const fun of aidFunArray) {
    data = await fun();
    if (data.msg === '0') return data;
  }
}
