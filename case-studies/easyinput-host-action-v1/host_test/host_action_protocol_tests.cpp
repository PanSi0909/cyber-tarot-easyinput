#include <algorithm>
#include <array>
#include <cassert>
#include <cstdint>
#include <string>
#include <vector>

#include "keyboard/host_action_protocol.h"
#include "keyboard/status_hid_protocol.h"

namespace {

constexpr char kCanonicalAction[] =
    "host_action:12345678-90ab-cdef-0123-456789abcdef";
constexpr char kCanonicalUuid[] =
    "12345678-90ab-cdef-0123-456789abcdef";

void accepts_only_canonical_lowercase_uuid_actions() {
  assert(ai_keyboard::is_canonical_host_action(kCanonicalAction));
  assert(ai_keyboard::is_canonical_host_action(
      "host_action:00000000-0000-0000-0000-000000000000"));
  assert(ai_keyboard::is_canonical_host_action(
      "host_action:ffffffff-ffff-ffff-ffff-ffffffffffff"));

  const std::vector<std::string> invalid{
      "host_action:12345678-90AB-cdef-0123-456789abcdef",
      "host_action:12345678-90ab-cdef-0123-456789abcde",
      "host_action:123456789-0ab-cdef-0123-456789abcdef",
      "host_action:12345678-90ab-cdef-0123-456789abcdeg",
      "12345678-90ab-cdef-0123-456789abcdef",
  };
  for (const auto& action : invalid) {
    assert(!ai_keyboard::is_canonical_host_action(action));
  }
}

void encodes_the_frozen_host_action_v1_report() {
  static_assert(ai_keyboard::kHostActionAppCommandReportId == 0x11);
  static_assert(ai_keyboard::kHostActionAppCommandKind == 0x05);
  static_assert(ai_keyboard::kStatusResponseCommandKind == 0x04);
  static_assert(ai_keyboard::kHostActionAppCommandKind !=
                ai_keyboard::kStatusResponseCommandKind);
  static_assert(ai_keyboard::kHostActionAppCommandPayloadLen == 63);
  static_assert(ai_keyboard::kHostActionUuidLen == 36);

  std::array<std::uint8_t,
             ai_keyboard::kHostActionAppCommandPayloadLen> payload{};
  assert(ai_keyboard::encode_host_action_v1(kCanonicalAction, &payload));
  assert(payload[0] == 0x05);
  assert(payload[1] == 0);
  assert(payload[2] == 1);
  assert(payload[3] == 36);
  assert(std::equal(kCanonicalUuid,
                    kCanonicalUuid + ai_keyboard::kHostActionUuidLen,
                    payload.begin() + 4));
  assert(std::all_of(payload.begin() + 40,
                     payload.end(),
                     [](std::uint8_t value) { return value == 0; }));
}

void invalid_actions_fail_closed_without_partial_output() {
  std::array<std::uint8_t,
             ai_keyboard::kHostActionAppCommandPayloadLen> payload{};
  payload.fill(0xA5);
  assert(!ai_keyboard::encode_host_action_v1(
      "host_action:12345678-90AB-cdef-0123-456789abcdef", &payload));
  assert(std::all_of(payload.begin(),
                     payload.end(),
                     [](std::uint8_t value) { return value == 0xA5; }));
  assert(!ai_keyboard::encode_host_action_v1(kCanonicalAction, nullptr));
}

}  // namespace

int main() {
  accepts_only_canonical_lowercase_uuid_actions();
  encodes_the_frozen_host_action_v1_report();
  invalid_actions_fail_closed_without_partial_output();
  return 0;
}
