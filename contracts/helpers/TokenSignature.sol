// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

contract TokenSignature {
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    struct SignData {
        address buyer;
        uint256 tokenId;
        string uri;
        uint256 price;
    }

    bytes32 internal constant EIP712DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );

    bytes32 internal constant SIGNDATA_TYPEHASH =
        keccak256(
            "SignData(address buyer,uint256 tokenId,string uri,uint256 price)"
        );
    bytes32 internal EIP712DOMAIN_SEPARATOR;

    function __Signature_init(string memory _name, string memory _version)
        internal
    {
        EIP712DOMAIN_SEPARATOR = _hash(
            EIP712Domain({
                name: _name,
                version: _version,
                chainId: block.chainid,
                verifyingContract: address(this)
            })
        );
    }

    function _hash(EIP712Domain memory domain) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    EIP712DOMAIN_TYPEHASH,
                    keccak256(bytes(domain.name)),
                    keccak256(bytes(domain.version)),
                    domain.chainId,
                    domain.verifyingContract
                )
            );
    }

    function _hash(SignData memory signData) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    SIGNDATA_TYPEHASH,
                    signData.buyer,
                    signData.tokenId,
                    keccak256(abi.encodePacked(signData.uri)),
                    signData.price
                )
            );
    }

    function _getSigner(
        address buyer,
        uint256 tokenId,
        string memory uri,
        uint256 price,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (address) {
        bytes32 digest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                EIP712DOMAIN_SEPARATOR,
                _hash(
                    SignData({
                        buyer: buyer,
                        tokenId: tokenId,
                        uri: uri,
                        price: price
                    })
                )
            )
        );
        return ecrecover(digest, v, r, s);
    }
}
