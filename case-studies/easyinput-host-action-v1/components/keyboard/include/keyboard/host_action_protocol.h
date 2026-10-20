#pragma once

#include <array>
#include <cstddef>
#include <cstdint>
#include <string_view>

namespace ai_keyboard {

inline constexpr std::string_view kHostActionPrefix = "host_action:";
inline constexpr std::size_t kHostActionUuidLen = 36;
inline constexpr std::uint8_t kHostActionAppCommandReportId = 0x11;
inline constexpr std::uint8_t kHostActionAppCommandKind = 0x05;
inline constexpr std::size_t kHostActionAppCommandPayloadLen = 63;

bool is_canonical_host_action(std::string_view action);

bool encode_host_action_v1(
    std::string_view action,
    std::array<std::uint8_t, kHostActionAppCommandPayloadLen>* out);

}  // namespace ai_keyboard
