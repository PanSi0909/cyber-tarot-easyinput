#include "keyboard/host_action_protocol.h"

#include <algorithm>

namespace ai_keyboard {

bool is_canonical_host_action(std::string_view action) {
  if (action.size() != kHostActionPrefix.size() + kHostActionUuidLen ||
      action.substr(0, kHostActionPrefix.size()) != kHostActionPrefix) {
    return false;
  }

  const auto uuid = action.substr(kHostActionPrefix.size());
  for (std::size_t index = 0; index < uuid.size(); ++index) {
    const bool hyphen_position =
        index == 8 || index == 13 || index == 18 || index == 23;
    if (hyphen_position) {
      if (uuid[index] != '-') {
        return false;
      }
      continue;
    }
    if (!((uuid[index] >= '0' && uuid[index] <= '9') ||
          (uuid[index] >= 'a' && uuid[index] <= 'f'))) {
      return false;
    }
  }
  return true;
}

bool encode_host_action_v1(
    std::string_view action,
    std::array<std::uint8_t, kHostActionAppCommandPayloadLen>* out) {
  if (out == nullptr || !is_canonical_host_action(action)) {
    return false;
  }

  std::array<std::uint8_t, kHostActionAppCommandPayloadLen> payload{};
  payload[0] = kHostActionAppCommandKind;
  payload[1] = 0;
  payload[2] = 1;
  payload[3] = static_cast<std::uint8_t>(kHostActionUuidLen);
  const auto uuid = action.substr(kHostActionPrefix.size());
  std::copy(uuid.begin(), uuid.end(), payload.begin() + 4);
  *out = payload;
  return true;
}

}  // namespace ai_keyboard
