// VDO.Ninja Room Configuration
// Room: TrueNorth1
// These links should stay constant - update here if room changes

const VDO_NINJA_ROOMS = {
  cam1: {
    label: 'Host',
    humanLink: 'https://vdo.ninja/?room=TrueNorth1&push=CAM_A&label=Host',
    obsLink: 'https://vdo.ninja/?view=CAM_A&solo&room=TrueNorth1',
    obsScreenshareLink: 'https://vdo.ninja/?view=CAM_A:s&solo&room=TrueNorth1'
  },
  cam2: {
    label: 'CoHost',
    humanLink: 'https://vdo.ninja/?room=TrueNorth1&push=CAM_B&label=CoHost',
    obsLink: 'https://vdo.ninja/?view=CAM_B&solo&room=TrueNorth1'
  },
  cam3: {
    label: 'Guest2',
    humanLink: 'https://vdo.ninja/?room=TrueNorth1&push=CAM_C&label=Guest2',
    obsLink: 'https://vdo.ninja/?view=CAM_C&solo&room=TrueNorth1'
  },
  cam4: {
    label: 'Guest3',
    humanLink: 'https://vdo.ninja/?room=TrueNorth1&push=CAM_D&label=Guest3',
    obsLink: 'https://vdo.ninja/?view=CAM_D&solo&room=TrueNorth1'
  },
  cam5: {
    label: 'Guest4',
    humanLink: 'https://vdo.ninja/?room=TrueNorth1&push=CAM_E&label=Guest4',
    obsLink: 'https://vdo.ninja/?view=CAM_E&solo&room=TrueNorth1'
  },
  cam6: {
    label: 'Guest5',
    humanLink: 'https://vdo.ninja/?room=TrueNorth1&push=CAM_F&label=Guest5',
    obsLink: 'https://vdo.ninja/?view=CAM_F&solo&room=TrueNorth1'
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VDO_NINJA_ROOMS;
}

